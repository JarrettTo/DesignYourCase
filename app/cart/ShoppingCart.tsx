import Link from "next/link";
import ShoppingCartItem from "../../components/ShoppingCartItem";

export default function ShoppingCart() {
  return (
    <div className="flex min-h-screen">
      <div className="p-20 flex-1 overflow-y-auto">
        <div className="flex items-end mb-16">
          <h1 className="text-4xl font-bold text-gray-700">Shopping cart</h1>
          <h2 className="text-xl ml-10 font-bold text-gray-700">3 items</h2>
        </div>
        <div className="flex flex-col">
          <div className="h-10 grid grid-cols-12 content-center justify-items-center text-gray-500">
            <input type="checkbox" />
            <p className="col-span-4 justify-self-start">CASE DETAILS</p>
            <p className="col-span-2">QUANTITY</p>
            <p className="col-span-2">PRICE</p>
            <p className="col-span-2">TOTAL</p>
            <div className="col-span-1"></div>
          </div>
          <ShoppingCartItem />
          <ShoppingCartItem />
          <ShoppingCartItem />
          <ShoppingCartItem />
          <ShoppingCartItem />
        </div>
      </div>

      <div className="bg-gray-50 w-1/3">
        <div className="p-20 sticky top-0 space-y-8">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-700">Order Summary</h1>
          </div>
          <div className="grid grid-cols-5 items-center">
            <div className="w-16 h-16 bg-orange-50 text-xs">
              Insert Image Here
            </div>
            <div className="col-span-3">
              <p>S22 Transparent Blue Case</p>
              <p className="text-sm text-gray-600">1&times;</p>
            </div>
            <div className="grid grid-rows-2 justify-items-end">
              <p>25.0</p>
              <p className="text-sm text-gray-600"></p>
            </div>
          </div>
          <div className="grid grid-cols-5 items-center">
            <div className="w-16 h-16 bg-orange-50 text-xs">
              Insert Image Here
            </div>
            <div className="col-span-3">
              <p>iPhone 15 Matte Yellow Case</p>
              <p className="text-sm text-gray-600">3&times;</p>
            </div>
            <div className="grid grid-rows-2 justify-items-end">
              <p>96.0</p>
              <p className="text-sm text-gray-600">32.0 each</p>
            </div>
          </div>
          <div className="grid grid-cols-2">
            <p>Subtotal</p>
            <p className="justify-self-end">121.0</p>
          </div>
          <div className="grid grid-cols-2">
            <p>Shipping</p>
            <p className="justify-self-end">20.0</p>
          </div>
          <hr className="border-t border-gray-300 my-4"></hr>
          <div className="grid grid-cols-2">
            <p className="font-bold">Total</p>
            <p className="font-bold justify-self-end">141.0</p>
          </div>

          <div className="flex justify-center">
            <Link
              href=""
              className="bg-[#9883FD] text-white py-2 w-full rounded text-center"
            >
              Check Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
