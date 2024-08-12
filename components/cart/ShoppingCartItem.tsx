/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { ChangeEvent } from "react";

interface ShoppingCartItemProps {
  id: number;
  image: string;
  material: string;
  color: string;
  model: string;
  quantity: number;
  price: number;
  selected: boolean;
  onCheckboxChange: (id: number) => void;
  onQuantityChange: (id: number, quantity: number) => void;
}

const ShoppingCartItem: React.FC<ShoppingCartItemProps> = ({
  id,
  image,
  color,
  material,
  model,
  quantity,
  price,
  selected,
  onCheckboxChange,
  onQuantityChange,
}) => {
  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(id, quantity - 1);
    }
  };

  const handleIncrement = () => {
    onQuantityChange(id, quantity + 1);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numberValue = parseInt(value, 10);

    if (value === "" || (numberValue >= 0 && !isNaN(numberValue))) {
      onQuantityChange(id, numberValue || 0); // Set to 0 if empty
    }
  };

  return (
    <div className="h-48 py-6 grid grid-cols-12 justify-items-center items-center">
      <input
        type="checkbox"
        onChange={() => onCheckboxChange(id)}
        checked={selected}
      />
      <div className="col-span-4 flex flex-row justify-self-start">
        <img src={image} alt="Case Design" className="w-32 h-32" />
        <div className="ml-8 flex flex-col justify-center">
          <p>Color: {color}</p>
          <p>Material: {material}</p>
          <p>Model: {model}</p>
          <p>EDIT</p>
        </div>
      </div>
      <div className="col-span-2 flex flex-row items-center">
        <p onClick={handleDecrement} className="cursor-default select-none">
          -
        </p>
        <input
          type="text"
          className="w-8 h-8 border border-gray-300 p-0.5 rounded mx-4 text-center"
          value={quantity}
          onChange={handleInputChange}
        />
        <p onClick={handleIncrement} className="cursor-default select-none">
          +
        </p>
      </div>
      <div className="col-span-2">
        <p>{price}</p>
      </div>
      <div className="col-span-2">
        <p>{price * quantity}</p>
      </div>
      <div className="">
        <p className="text-sm font-bold">&#10005;</p>
      </div>
    </div>
  );
};

export default ShoppingCartItem;
