import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function sendEmail(to: string, subject: string, text: string, html?: string, attachments?: any[]) {
  // Configure nodemailer for Mailjet SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.mailjet.com', // Mailjet SMTP host
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER, // Mailjet API Key
      pass: process.env.SMTP_PASS, // Mailjet Secret Key
    },
  });
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    attachments,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('id');
  if (!orderId) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  // 1. Fetch all orders with the given order_id
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', orderId);
  if (orderError || !orders || orders.length === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // 2. Join designs and case_styles for all designs in the orders
  const designIds = orders.map(o => o.design_id);
  const { data: designs, error: designError } = await supabase
    .from('designs')
    .select('*, case_styles(*)')
    .in('id', designIds);
  if (designError || !designs || designs.length === 0) {
    return NextResponse.json({ error: 'Designs not found' }, { status: 404 });
  }

  // 3. Get user email (from user table)
  let userEmail = null;
  if (orders[0].customer_id) {
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('email')
      .eq('id', orders[0].customer_id)
      .single();
    if (user && user.email) userEmail = user.email;
  }

  // 4. Get all images from bucket except stage.png, per design
  let designImageLinks: Record<string, string[]> = {};
  if (userEmail && designs.length > 0) {
    for (const d of designs) {
      const { data: files, error: listError } = await supabase.storage
        .from('phone-case-designs')
        .list(`design-images/${userEmail}/${d.id}`);
      if (!listError && files) {
        designImageLinks[d.id] = [];
        for (const file of files) {
          if (file.name !== 'stage.png') {
            const { data: publicUrlData } = supabase.storage
              .from('phone-case-designs')
              .getPublicUrl(`design-images/${userEmail}/${d.id}/${file.name}`);
            if (publicUrlData?.publicUrl) designImageLinks[d.id].push(publicUrlData.publicUrl);
          }
        }
      }
    }
  }

  // 5. Group by case_styles.seller (email)
  const groups: Record<string, any[]> = {};
  for (const d of designs) {
    const seller = d.case_styles?.seller || 'unknown';
    if (!groups[seller]) groups[seller] = [];
    groups[seller].push(d);
  }

  // 6. Print and send the email for each group
  for (const [seller, sellerDesigns] of Object.entries(groups)) {
    const cs = sellerDesigns[0].case_styles;
    let emailText = `To: ${seller}\n\nHi!\n\nWe would like to order these designs for\n`;
    let emailHtml = `<p>Hi!<br><br>We would like to order these designs for</p>`;
    let attachments: any[] = [];
    sellerDesigns.forEach((d, idx) => {
      emailText += `\nDesign ${idx + 1}:\n`;
      emailText += `- Phone Brand: ${cs.phoneBrand}\n`;
      emailText += `- Phone Model: ${cs.phoneModel}\n`;
      emailText += `- Color: ${cs.color}\n`;
      emailText += `- Material: ${cs.material}\n`;
      emailText += `\nDesign Image: ${d.image_url}\n`;
      const links = designImageLinks[d.id] || [];
      // HTML block for this design
      emailHtml += `<h3>Design ${idx + 1}:</h3>`;
      emailHtml += `<ul>`;
      emailHtml += `<li>Phone Brand: ${cs.phoneBrand}</li>`;
      emailHtml += `<li>Phone Model: ${cs.phoneModel}</li>`;
      emailHtml += `<li>Color: ${cs.color}</li>`;
      emailHtml += `<li>Material: ${cs.material}</li>`;
      emailHtml += `</ul>`;
      if (d.image_url) {
        // Attach the main design image
        const cid = `designimg-${d.id}@case`;
        attachments.push({ filename: `design_${d.id}.png`, path: d.image_url, cid });
        emailHtml += `<div><b>Design Image:</b><br><img src="cid:${cid}" style="max-width:300px;max-height:300px;"/></div>`;
      }
      if (links.length > 0) {
        emailHtml += `<div><b>Other Images:</b><br>`;
        links.forEach((link, i) => {
          const cid = `otherimg-${d.id}-${i}@case`;
          attachments.push({ filename: `other_${d.id}_${i}.png`, path: link, cid });
          emailHtml += `<img src="cid:${cid}" style="max-width:200px;max-height:200px;margin:4px;"/>`;
        });
        emailHtml += `</div>`;
      }
    });
    emailText += `\n\nOrder ID: ${orderId}\n`;
    emailText += `Thanks!`;
    emailHtml += `<br><br><b>Order ID:</b> ${orderId}<br>Thanks!`;
    console.log(emailText);
    // Send the email (in production, handle errors/logging)
    try {
      await sendEmail(seller, `New Case Order - Order #${orderId}`, emailText, emailHtml, attachments);
    } catch (e) {
      console.error('Failed to send email to', seller, e);
    }
  }

  return NextResponse.json({ status: 'ok', debug: 'Printed and sent emails' });
} 