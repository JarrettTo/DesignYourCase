export default function ShoppingCartItem() {
  return (
    <div className="h-48 py-6 grid grid-cols-12 justify-items-center items-center">
      <input type="checkbox" />
      <div className="col-span-4 flex flex-row justify-self-start">
        <div className="w-32 h-32 bg-orange-50">Insert Image Here</div>
        <div className="ml-8 flex flex-col justify-center">
          <p>Color: Transparent</p>
          <p>Image: Custom</p>
          <p>Model: Samsung S23</p>
          <p>EDIT</p>
        </div>
      </div>
      <div className="col-span-2 flex flex-row items-center">
        <p>-</p>
        <input
          type="text"
          className="w-8 h-8 border border-gray-300 p-0.5 rounded mx-4 text-center"
          defaultValue="5"
        />
        <p>+</p>
      </div>
      <div className="col-span-2">
        <p>50.0</p>
      </div>
      <div className="col-span-2">
        <p>250.0</p>
      </div>
      <div className="">
        <p className="text-sm font-bold">&#10005;</p>
      </div>
    </div>
  );
}
