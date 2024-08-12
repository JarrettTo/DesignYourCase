/* eslint-disable @next/next/no-img-element */
interface OrderSummaryItemProps {
  id: number;
  image: string;
  material: string;
  color: string;
  model: string;
  quantity: number;
  price: number;
  selected: boolean;
}

const OrderSummaryItem: React.FC<OrderSummaryItemProps> = ({
  id,
  image,
  color,
  material,
  model,
  quantity,
  price,
  selected,
}) => {
  return (
    <div className="flex items-center">
      <img src={image} alt="Case Design" className="w-16 h-16" />
      <div className="flex-1 ml-4">
        <p>
          {model} {material} {color} Case
        </p>
        <p className="text-sm text-gray-600">{quantity}&times;</p>
      </div>
      <div className="flex flex-col items-end">
        <p>{price * quantity}</p>
        <p className="text-sm text-gray-600">
          {quantity > 1 ? `${price} each` : "\u00A0"}
        </p>
      </div>
    </div>
  );
};

export default OrderSummaryItem;
