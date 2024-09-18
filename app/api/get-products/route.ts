import fs from 'fs';
import path from 'path';

export async function GET() {
    // Define the path to the JSON file
    const filePath = path.join(process.cwd(), 'data', 'products.json');

    try { 
        // If the file exists, append the new data
        const fileContents = fs.readFileSync(filePath, 'utf8');

        let currentData = [];
        if (fileContents.trim() !== "") {
            currentData = JSON.parse(fileContents);
            return Response.json({currentData});
        }
        
        return Response.json({ message: 'No products to read' });
    } catch (error) {
        console.error('Error reading product:', error);
        return Response.json({ message: 'Error reading product' });
    }
}
