'use client'

import React, { useState } from 'react';
import ItemCard from "./item-card";
import { PrimeReactProvider } from 'primereact/api';
import { Checkbox } from 'primereact/checkbox';
import { classNames } from 'primereact/utils';

export default function ProductListing() {

    const DesignStyle = {
        checkbox: {
          root: {
              className: classNames('cursor-pointer inline-flex relative select-none align-bottom', 'w-6 h-6')
          },
          input: {
              className: classNames('absolute appearance-none top-0 left-0 size-full p-0 m-0 opacity-0 z-10 outline-none cursor-pointer')
          },
          //@ts-ignore
          box: ({ props, context }) => ({
              className: classNames(
                  'flex items-center justify-center',
                  'border-2 w-[20px] h-[20px] text-gray-600 rounded-md transition-colors duration-200',
                  {
                      'border-purple bg-white': !context.checked,
                      'border-purple bg-purple': context.checked
                  },
                  {
                      'hover:border-gray-300 hover:shadow-[0_0_0_0.2rem_rgba(191,219,254,1)] ': !props.disabled,
                      'cursor-default opacity-60': props.disabled
                  }
              )
          }),
          icon: 'w-[12px] h-[12px] transition-all duration-200 text-white text-base '
      }
    }

    const brands = [
        {name: "Apple", key: "apple"},
        {name: "Samsung", key: "samsung"},
        {name: "Xiaomi", key: "xiaomi"},
        {name: "Huawei", key: "huawei"}
    ];

    const [selectedCategories, setSelectedCategories] = useState([brands[0], brands[1], brands[2], brands[3]]);

    const onCategoryChange = (e: any) => {
        let _selectedCategories = [...selectedCategories];

        if (e.checked)
            _selectedCategories.push(e.value);
        else
            _selectedCategories = _selectedCategories.filter(category => category.key !== e.value.key);

        setSelectedCategories(_selectedCategories);
    };

    return(
        // @ts-ignore
        <PrimeReactProvider value={{unstyled: true, pt: DesignStyle }}>
             <div className="w-full h-full flex flex-row items-start justify-center bg-white">
                <div className="w-[200px] h-full my-14 flex flex-col justify-start items-start">
                    <p className="w-full h-[35px] text-black text-2xl font-bold font-Poppins">SEARCH FILTER</p>
                    <p className="mt-10 mb-3 text-black text-[20px] font-semibold font-Poppins">By Brand</p>
                    {brands?.map((category) => (
                        <div key={category.key} className="flex items-center">
                            <Checkbox inputId={category.key} name="category" value={category} onChange={onCategoryChange} checked={selectedCategories.some((item) => item.key === category.key)} />
                            <label htmlFor={category.key} className="ml-2 text-[20px]">
                                {category.name}
                            </label>
                        </div>
                    ))}
                </div>
                <div className="w-[1200px] h-full flex items-center justify-center flex-wrap my-14">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <ItemCard key={index}/>
                    ))}
                </div>
            </div>
        </PrimeReactProvider>
       
    );
}