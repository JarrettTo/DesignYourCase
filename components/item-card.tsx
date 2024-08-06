type ItemCardProps = {
    productName: string;
}

export default function ItemCard({productName}: ItemCardProps) {
    
    return(
    <div className="w-[273px] h-[339px] mx-[50px] mb-14">
        <div className="w-[273px] h-[273px] bg-[#c8bfdc] flex items-center justify-center">
            <img className="w-[126.45px] h-[229.13px]" src="https://via.placeholder.com/126x229" />
        </div>
        <p className="w-full h-[35px] text-black text-base font-semibold font-Poppins">{productName}</p>
        <p className="w-full h-[35px] text-black text-base font-normal font-Poppins">$100</p>
    </div>
    );
}