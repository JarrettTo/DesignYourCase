import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    // Define the path to the JSON file
    const filePath = path.join(process.cwd(), 'data', 'products.json');

    try {
        // Read the existing file contents
        let currentData = [];
        if (fs.existsSync(filePath)) {
            const fileContents = fs.readFileSync(filePath, 'utf8');
            if (fileContents.trim() !== "") {
                currentData = JSON.parse(fileContents);
            }
        }

        // Determine the next ID
        const nextId = currentData.length ? Math.max(currentData.map((p: { productId: number; }) => p.productId)) + 1 : 1;

        // Parse the request body
        const data = await req.json();

        // Create a new product with the auto-incremented ID
        const newProduct = {
            productId: nextId,
            ...data
        };

        // Append the new product data
        currentData.push(newProduct);

        // Write updated data back to the JSON file
        fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2), 'utf8');

        return Response.json({ message: 'Product saved successfully', newProduct });
    } catch (error) {
        console.error('Error saving product:', error);
        return Response.json({ message: 'Error saving product' });
    }
}
