import React from 'react'
import { useNavigate } from 'react-router-dom'

const CategoryCard = ({ category }) => {
    const navigate=useNavigate();
    
  return (
    <div className="group relative overflow-hidden rounded-lg bg-gray-100 h-64 cursor-pointer" onClick={()=>navigate('/products/'+category.name.toLowerCase())}>
      <img loading='lazy' 
        src={category.imageUrl} 
        alt={category.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
        <div>
          <h3 className="text-xl font-bold text-white">{category.name}</h3>
          <button className="mt-2 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Shop Now →
          </button>
        </div>
      </div>
    </div>
  )
}

export default CategoryCard