"use client";

import Link from "next/link";
import ShoppingCartItem from "../../components/cart/ShoppingCartItem";
import OrderSummaryItem from "../../components/cart/OrderSummaryItem";
import { useState } from "react";

const CheckoutPage: React.FC = () => {
  const [shoppingCartItems, setShoppingCartItems] = useState(SavedDesigns);
  const shipping = 20; //placeholder

  const subtotal = shoppingCartItems
    .filter((item) => item.selected) // Filter selected items
    .reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className="flex flex-col-reverse lg:flex-row min-h-screen">
      <div className="p-20 flex-1 overflow-y-auto bg-white"></div>
      <div className="bg-gray-50 w-full lg:w-1/3">
        <div className="p-20 md:p-32 lg:p-20 sticky top-0 space-y-8 flex flex-col">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-700">Order Summary</h1>
          </div>
          {shoppingCartItems
            .filter((item) => item.selected)
            .map((item) => (
              <OrderSummaryItem key={item.id} {...item} />
            ))}
          <div className="flex flex-col space-y-4 mt-4">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>
                {shoppingCartItems.some((item) => item.selected)
                  ? subtotal
                  : ""}
              </p>
            </div>
            <div className="flex justify-between">
              <p>Shipping</p>
              <p>
                {shoppingCartItems.some((item) => item.selected)
                  ? shipping
                  : ""}
              </p>
            </div>
            <hr className="border-t border-gray-300 my-4" />
            <div className="flex justify-between font-bold">
              <p>Total</p>
              <p>
                {shoppingCartItems.some((item) => item.selected)
                  ? subtotal + shipping
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

const SavedDesigns = [
  {
    id: 123,
    image: "https://picsum.photos/id/237/128",
    color: "Blue",
    material: "Transparent",
    model: "Samsung S22",
    quantity: 1,
    price: 40,
    selected: true,
  },
  {
    id: 124,
    image: "https://picsum.photos/id/238/128",
    color: "Clear",
    material: "Transparent",
    model: "iPhone 15 Pro Max",
    quantity: 1,
    price: 50,
    selected: true,
  },
  {
    id: 125,
    image: "https://picsum.photos/id/239/128",
    color: "Yellow",
    material: "Frosted",
    model: "Samsung S24",
    quantity: 1,
    price: 50,
    selected: true,
  },
  {
    id: 126,
    image: "https://picsum.photos/id/240/128",
    color: "Black",
    material: "Matte",
    model: "Pixel 7",
    quantity: 1,
    price: 40,
    selected: true,
  },
  {
    id: 127,
    image: "https://picsum.photos/id/241/128",
    color: "Pink",
    material: "Matte",
    model: "Zenfone 11",
    quantity: 1,
    price: 30,
    selected: false,
  },
  {
    id: 128,
    image: "https://picsum.photos/id/242/128",
    color: "Green",
    material: "Shiny",
    model: "Samsung S22",
    quantity: 1,
    price: 40,
    selected: false,
  },
  {
    id: 129,
    image: "https://picsum.photos/id/243/128",
    color: "Blue",
    material: "Matte",
    model: "iPhone 15 Pro Max",
    quantity: 1,
    price: 50,
    selected: false,
  },
  {
    id: 130,
    image: "https://picsum.photos/id/244/128",
    color: "Yellow",
    material: "Transparent",
    model: "Samsung S24",
    quantity: 1,
    price: 50,
    selected: false,
  },
  {
    id: 131,
    image: "https://picsum.photos/id/245/128",
    color: "Black",
    material: "Shiny",
    model: "Pixel 7",
    quantity: 1,
    price: 40,
    selected: false,
  },
  {
    id: 132,
    image: "https://picsum.photos/id/246/128",
    color: "Orange",
    material: "Transparent",
    model: "Zenfone 11",
    quantity: 1,
    price: 30,
    selected: false,
  },
];
