import Navbar from "../components/Navbar";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useContext, useEffect, useState } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import Footer from "../components/Footer";
import { FirebaseContext } from "../context/FirebaseContext";
import { toast } from "react-hot-toast";
import ShowProducts from "../components/ShowProducts";
import { useNavigate } from "react-router-dom";
import CategoryCard from "../components/CategoryCard";

const Home = () => {
  const [visibleProducts,setvisibleProducts]=useState([]);
  const [size, setSize] = useState('M'); // Default size
  const {user,setcart,products,category}=useContext(FirebaseContext);
  const navigate=useNavigate();
  useEffect(()=>{
    if(products && products.length > 0) {
      setvisibleProducts(products.slice(0, 8));
    }
  },[products]);


  const styles = {
  navigation: {
    '--swiper-navigation-color': 'black', // Change to your desired color
    '--swiper-navigation-size': '34px', // Optional: change size
  }
};
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar at the top */}
      <Navbar />

      {/* Main content area */}
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-10 ">
        {/* Hero section */}
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 1750 }}
          loop={true}
          slidesPerView={1}
          spaceBetween={50}
          allowTouchMove={false}
        >


          <SwiperSlide>
            <div className="relative bg-gray-200 overflow-hidden h-[80vh]">
              <img
                src="/banner-mobile.jpg"
                alt="Shoe Collection"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
              {/* <div className="relative z-10 flex items-center h-full">
                <div className="container mx-auto px-6 text-[#1A2433]">
                  <span className="text-sm uppercase tracking-widest">
                    Limited Edition
                  </span>
                  <h1 className="text-5xl md:text-7xl font-bold my-4">
                    REDEFINE YOUR RUN
                  </h1>
                  <p className="text-xl max-w-xl mb-8">
                    Performance meets style in our newest running collection
                  </p>
                  <div className="flex gap-4">
                    <button className="bg-gray-500 text-white px-8 py-3 font-medium hover:bg-gray-600 transition rounded-md">
                      Get the Look
                    </button>
                  </div>
                </div>
              </div> */}
            </div>
          </SwiperSlide>
          
          <SwiperSlide>
            <div className="relative overflow-hidden h-[80vh]">
              <img
                src="/banner.jpg"
                alt="Shoe Collection"
                className="absolute inset-0 w-full h-full object-contain opacity-70"
              />
              {/* <div className="relative z-10 flex items-center h-full">
                <div className="container mx-auto px-6 text-[#1A2433]">
                  <span className="text-sm uppercase tracking-widest">
                    Limited Edition
                  </span>
                  <h1 className="text-5xl md:text-7xl font-bold my-4">
                    REDEFINE YOUR RUN
                  </h1>
                  <p className="text-xl max-w-xl mb-8">
                    Performance meets style in our newest running collection
                  </p>
                  <div className="flex gap-4">
                    <button className="bg-gray-500 text-white px-8 py-3 font-medium hover:bg-gray-600 transition rounded-md">
                      Get the Look
                    </button>
                  </div>
                </div>
              </div> */}
            </div>
          </SwiperSlide>
        </Swiper>

        {/* Categories Section */}
        <section className="my-16 px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Categories</h2>
          </div>

          {/* Mobile Swiper (hidden on desktop) */}
          <div className="md:hidden">
            <Swiper
              modules={[Navigation, Pagination]}
              style={styles.navigation}
              spaceBetween={20}
              slidesPerView={1.2}
              centeredSlides={true}
              navigation
              pagination={{ clickable: true }}
              breakpoints={{
                480: {
                  slidesPerView: 1.5,
                },
                640: {
                  slidesPerView: 2,
                },
              }}
            >
              {category.map((category, index) => (
                <SwiperSlide key={index}>
                  <div className="group relative overflow-hidden rounded-lg bg-gray-100 h-64 mx-2">
                    <img
                      src={`/${category.name}.png`}
                      alt={`${category.name} Shoes`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {category.name}
                        </h3>
                        <button className="mt-2 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Shop Now →
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Desktop Grid (hidden on mobile) */}
          <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-6">
            {category.map((cat, index) => (
              <CategoryCard key={index} category={cat} />
            ))}
          </div>
        </section>

        {/* Products Section */}
        <section className="mt-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Featured Products</h2>
          </div>


          <ShowProducts visibleProducts={visibleProducts} />


          {/* View More Button */}
          <div className="text-center mt-12" onClick={() => navigate('/products/all')}>
            <button className="px-8 py-3 border-2 border-black rounded-lg font-medium hover:bg-black hover:text-white transition-colors cursor-pointer">
              View All Products
            </button>
          </div>
        </section>

        {/* Shipping & Returns Section */}
        <section className="py-10 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8 text-center">
              {/* Free Shipping */}
              <div className="p-6">
                <div className="mx-auto h-12 w-12 flex items-center justify-center bg-black rounded-full mb-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Free Shipping</h3>
                <p className="text-gray-600">On all orders over ₹300</p>
              </div>

              {/* Customer Support */}
              <div className="p-6">
                <div className="mx-auto h-12 w-12 flex items-center justify-center bg-black rounded-full mb-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">24/7 Support</h3>
                <p className="text-gray-600">Dedicated customer service</p>
              </div>

              {/* Secure Payments - New Element */}
              <div className="p-6">
                <div className="mx-auto h-12 w-12 flex items-center justify-center bg-black rounded-full mb-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Secure Payments</h3>
                <p className="text-gray-600">SSL encrypted checkout</p>
              </div>


            </div>
          </div>
        </section>


        {/* Limited Offer Banner */}
        {/* <section className="py-10 bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <div className="max-w-7xl mx-aut px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Last Chance - Summer Sale Ends Soon!</h2>
            <p className="text-xl mb-6">Get 20% off all summer collection shoes</p>
            
            <div className="flex justify-center items-center space-x-4 mb-8">
             
              <div className="bg-black bg-opacity-20 rounded-lg p-3 min-w-[70px]">
                <div className="text-2xl font-bold">02</div>
                <div className="text-sm">Days</div>
              </div>
              <div className="text-2xl">:</div>
              <div className="bg-black bg-opacity-20 rounded-lg p-3 min-w-[70px]">
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm">Hours</div>
              </div>
              <div className="text-2xl">:</div>
              <div className="bg-black bg-opacity-20 rounded-lg p-3 min-w-[70px]">
                <div className="text-2xl font-bold">45</div>
                <div className="text-sm">Mins</div>
              </div>
            </div>

            <div className="bg-white text-black inline-block px-4 py-2 rounded-md mb-6">
              <p className="font-semibold">Use Code : <span className="font-bold">SUMMER678</span></p>
            </div>
          </div>
        </section> */}
      </main>

      <Footer/>
    </div>
  );
};

export default Home;
