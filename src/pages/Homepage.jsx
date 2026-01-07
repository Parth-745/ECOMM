import React, { useContext, useEffect, useState } from "react";
import { FirebaseContext } from "../context/FirebaseContext";
import { toast } from "react-hot-toast";
import Marquee from "react-fast-marquee";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";
const Homepage = () => {
  // Get user and logout function from context
  const { user, logout, setcart, cart } = useContext(FirebaseContext);
  const [quantity, setquantity] = useState(1);
  const [products, setproducts] = useState([]);

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function addtocart(item) {
    try {
      const token = await user.getIdToken();

      const [response] = await toast.promise(
        Promise.all([
          fetch("http://localhost:4000/addtoCart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId: item._id,
              quantity: 1,
            }),
          }),
          delay(1500), // ensures at least 1.5s delay
        ]),
        {
          loading: "Adding...",
          success: "Item Added!",
          error: "Failed to add item",
        }
      );

      const data = await response.json();
      console.log("Server response:", data);

      if (data.success) {
        setcart(data.cart);
      } else {
        toast.error(data.message || "Add to cart failed.");
      }
    } catch (e) {
      console.error("Error adding to cart:", e);
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch("http://localhost:4000/getAllProducts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      // console.log(data);
      if (data.success) {
        setproducts(data.products);
      }
    } catch (e) {
      toast.error(e.message);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {user ? (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          {cart?.length > 0 && <div>{cart.length}</div>}
          <h1 className="text-2xl font-bold mb-4">User Profile</h1>
          <button
            onClick={() =>
              setcart((prev) => [...prev, { id: 123, name: "hello" }])
            }
          >
            Counter
          </button>

          <div className="space-y-4">
            <Swiper
              modules={[Autoplay]}
              autoplay={{ delay: 1000 }}
              loop={true}
              slidesPerView={1}
              spaceBetween={20}
            >
              <SwiperSlide>
                <img loading="lazy" src="shoebg.png" />
              </SwiperSlide>
              <SwiperSlide>
                <img loading="lazy" src="shoebg.png" />
              </SwiperSlide>
            </Swiper>

            {user.photoURL && (
              <div className="flex justify-center">
                <img
                  loading="lazy"
                  src={user.photoURL}
                  alt="Profile"
                  className="w-20 h-20 rounded-full"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">
                {user.displayName || "Not provided"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Account Created</p>
              <p className="font-medium">
                {new Date(user.metadata.creationTime).toLocaleString()}
              </p>
            </div>

            {products?.map((shoe, index) => {
              return (
                <div
                  key={index}
                  className="mt-4 p-4 bg-gray-50 rounded-md overflow-y-auto"
                >
                  <img
                    loading="lazy"
                    src={shoe.imageUrl}
                    alt=""
                    className="w-50 aspect-square"
                  />
                  <h2 className="text-lg font-semibold">{shoe.name}</h2>
                  <p className="text-sm text-gray-600">{shoe.description}</p>
                  <p className="text-md font-bold mt-2">₹{shoe.price}</p>
                  <button
                    className="px-4 py-2 bg-blue-500 rounded-xl text-white font-bold cursor-pointer"
                    onClick={() => {
                      addtocart(shoe);
                    }}
                  >
                    Add to cart
                  </button>
                </div>
              );
            })}

            <button
              onClick={logout}
              className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-lg">No user is currently signed in</p>
          <p className="text-gray-500 mt-2">
            Please login to view your profile information
          </p>
        </div>
      )}
    </div>
  );
};

export default Homepage;
