'use client'

import React, { useEffect, useState } from 'react';
import ItemCard from "./item-card";


export default function ProductListing() {
    // google translated product names for now
    const shops = [
        { link: "https://m.tb.cn/h.gePqtIIqogvFrGr?tk=7qQlWwjcXFp", name: "Suitable for Apple 13 mobile phone case customization 15 silicone iphone11 photo 12pro Huawei p40 to picture 14 pattern nova11 glass 8 love mate30 Honor 50 Xiaomi 10 one plus 9 customization"},
        { link: "https://m.tb.cn/h.g3FSu1i6Yw5r9rj?tk=4mMyWwjXGse", name: "Baby cutout photo customized mobile phone case suitable for any model of Apple 15promax/14 iPhonese Huawei mate60 pet couple 12 cutout avatar 11DIY pattern custom-made picture"},
        { link: "https://m.tb.cn/h.g3Zy6uNRTDMrpwa?tk=SeI0Wwj2jHR", name: "Film mobile phone case custom hard shell pattern photo diy all-inclusive lens protective case suitable for iphone14 Apple 13 Xiaomi 12 Huawei mate50 male oppo female p60 personalized vivo"},
    ];

    return(
        <div className="w-full h-full flex flex-col items-center justify-start bg-white">
            <p className="mt-20 font-Loubag text-[30px] text-[#A594F6]">Product Listings</p>
            <div className="w-[1200px] h-full flex flex-row flex-wrap items-start justify-center my-14">
                {shops?.map((item, index) => (
                    <ItemCard key={index} productName={item.name} link={item.link} index={index}/>
                ))}
            </div>
        </div>
   );
}