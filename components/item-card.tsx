export default function ItemCard() {
    
    return(
    <div className="w-full h-full flex bg-white">
        <div className="w-[1090px] h-[760px] flex items-center justify-center">
            <div className="w-[273px] h-[339px]">
                <div className="w-[273px] h-[273px] bg-[#c8bfdc] flex items-center justify-center">
                    <img className="w-[126.45px] h-[229.13px]" src="https://via.placeholder.com/126x229" />
                </div>
                <div className="w-full h-[35px] text-black text-base font-semibold font-['Poppins']">Galaxy S24 Ultra Transparent</div>
                <div className="w-full h-[35px] text-black text-base font-normal font-['Poppins']">$100</div>
            </div>
        </div>
    </div>
    );
}