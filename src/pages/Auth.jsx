import React, { useEffect } from 'react';
import { FcGoogle } from "react-icons/fc";
import {FirebaseContext} from '../context/FirebaseContext';
import { useContext } from 'react';
import { useState } from 'react';
import OtpInput from 'react-otp-input'
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import {toast} from 'react-hot-toast';
import { ScaleLoader } from 'react-spinners';


const Auth = () => {
  const navigate = useNavigate();
  const [state, setState] = useState('email');
  const [login,setlogin] = useState(false);

  const [email, setEmail] = useState("");
  const [OTP, setOTP] = useState("");
  const [password, setPassword] = useState("");

  const [otpBtnEnabled, setOtpBtnEnabled] = useState(false);
  const [sendOtpBtn,setsendOtpBtn]=useState(false);

  const [loginBtnEnabled, setLoginBtnEnabled] = useState(true);

  const [loginBtnLoader, setLoginBtnLoader] = useState(true);

  const [setPasswordBtn, setSetPasswordBtn] = useState(false);

  useEffect(()=>{
    if(password.length >= 6) setSetPasswordBtn(true);
    else setSetPasswordBtn(false);
  },[password])


  useEffect(() => {
    setEmail("");
    setOTP("");
    setPassword("");
  },[login])

  useEffect(()=>{
    if(email.length===0 || password.length===0) setLoginBtnEnabled(false);
    else setLoginBtnEnabled(true);
  },[email,password])


  const {signInWithGoogle,registerWithEmailAndPassword,loginWithEmailAndPassword,setloading} = useContext(FirebaseContext);

  const RegisterUsingGoogle = async () => {
          const toastId=toast.loading("Authenticating...")
    try{
      const user=await signInWithGoogle();
      if (!user) {
        toast.error("Google sign-in cancelled");
        toast.dismiss(toastId);
        return;
      }
      const response=await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.displayName || null,
          email: user.email,
          firebaseUid: user.uid,
        }),
      })

      const data = await response.json();
      if(data.success){
        console.log("User registered successfully:", data.user);
        navigate('/');
      } else {
        console.error("Registration failed:", data.message);
      }
    }
    catch(error) {
      console.error("Error during registration:", error);
    }
    finally{
      toast.dismiss(toastId);
    }
  }

  async function otpHandler() {
    if(!email) return enqueueSnackbar("Please enter your email", { preventDuplicate:true,variant: 'error' });
    setState('otp');
    try{
      const response = await fetch('http://localhost:4000/SendOtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json();
      if(data.success){
        toast.success("OTP SENT ! ");
        setOtpBtnEnabled(true);
        setState('otp');
      } else {
        console.error("Failed to send OTP:", data.message);
        toast.error("Errors while sending otp");
      }
    }
    catch(e){
      toast.error(e);
      console.error("Error sending OTP:", e);
    }
  }

  async function otpMatchHandler() {
    if(!OTP || OTP.length !== 6) return enqueueSnackbar("Please enter a valid 6-digit OTP", { preventDuplicate:true,variant: 'error' });
    if(!otpBtnEnabled) return;
    
    try{
      const response = await fetch('http://localhost:4000/MatchOtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: OTP }),
      })

      const data = await response.json();
      if(data.success){
        console.log("OTP matched successfully");
        setState('password');
        setOtpBtnEnabled(false);
      } else {
        enqueueSnackbar("Invalid OTP, please try again", { preventDuplicate:true,variant: 'error' });
      }
    }
    catch(e){
      console.error("Error matching OTP:", e);
    }
  }

  async function registerHandler() {
    const toastId=toast.loading("Creatint Account...")
    if(!password) return enqueueSnackbar("Password must be 6-digit long", { preventDuplicate:true,variant: 'error' });
    try{
      const user=await registerWithEmailAndPassword(email, password);
      const response = await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.displayName || null,
          password: password,
          email: user.email,
          firebaseUid: user.uid,
         }),
      })

      const data = await response.json();
      if(data.success){
        console.log("User registered successfully");
        navigate('/');
      } else {
        console.error("Registration failed:", data.message);
        toast.error("Account already exist ! ");
      }
    }
    catch(e){
      console.error("Error during registration:", e);
      toast.error("Account already exist ! ");
    }
    finally{
      toast.dismiss(toastId);
    }
  }

  async function loginHandler() {
    if(!email || !password) return enqueueSnackbar("Please enter your email and password", { preventDuplicate:true,variant: 'error' });
    setLoginBtnLoader(false);
    try{
      const user = await loginWithEmailAndPassword(email, password);
      if(user){
        console.log("User logged in successfully");
        navigate('/');
      } else {
        console.error("Login failed");
      }
    }
    catch(e){
      console.error("Error during login:", e);
    }
    finally{
      setLoginBtnLoader(true);
    }

  }

  useEffect(()=>{
    if(email.length==0 || password.length===0) setsendOtpBtn(false);
    if(email.length>0) setsendOtpBtn(true);
  },[email ,password])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1A2433]">
     
      <div className="seamless-scroller">
        <div className="scroll-layer"></div>
        <div className="scroll-layer"></div>
      </div>

      {!login && (
        <div className="relative flex justify-center items-center min-h-screen bg-opacity-50 backdrop-blur-xs z-[1]">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-4">
          {/* Header */}
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="bg-gray-400 w-5 h-5 rounded-full mb-1"></div>
            <h1 className="text-2xl font-bold text-[#333333] mb-2 poppins-medium">Create an account</h1>
            <p className="poppins-regular text-[#333333]">
              Already have an account?{' '}
              <span className="cursor-pointer underline" onClick={()=>{setlogin(true)}}>Log in</span>
            </p>
          </div>

          {state === 'email' && (
          <div className="space-y-4 mb-6">
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#666666] mb-2">
                Your email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button className={`w-full ${sendOtpBtn ? 'bg-[#505b9a]' : 'bg-[#c3c3c3]'} text-white py-2 px-4 rounded-full  transition cursor-pointer`} onClick={otpHandler}>
              Send OTP
            </button>
          </div>)}

          {state === 'otp' && (
                  <div className="space-y-4 mb-6">
                    <label className="block text-sm font-medium text-[#666666] mb-2">
                      6 digit OTP
                    </label>
                    <OtpInput
                            value={OTP}
                            onChange={setOTP}
                            numInputs={6}
                            renderSeparator={<span style={{ width: '8px' }} />}
                            shouldAutoFocus={true}
                            isInputNum={true}
                            inputType="tel"
                            isDisabled={false}
                            separatorStyle={{ width: '8px' }}
                            
                            renderInput={(props) => (
                              <input
                                {...props}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  margin: '0 4px',
                                  fontSize: '18px',
                                  border: 'none',
                                  borderBottom: '2px solid #666666',
                                  textAlign: 'center',
                                  outline: 'none',
                                  transition: 'border-color 0.3s',
                                }}
                              />
                            )}
                            inputStyle={{
                              width: '32px',
                              border: 'none',
                              borderBottom: '2px solid #ddd',
                            }}
                            containerStyle={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          />
                    <button 
                      className={`w-full ${otpBtnEnabled ? 'bg-[#505b9a]' : 'bg-[#c3c3c3]'} text-white py-2 px-4 rounded-full  transition cursor-pointer`} 
                      onClick={otpMatchHandler}
                    >
                      Verify OTP
                    </button>
                  </div>
          )}

          {state === 'password' && (
          <div className="space-y-4 mb-6">
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#666666] mb-2">
                Set Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className={`w-full ${setPasswordBtn ? 'bg-[#505b9a]' : 'bg-[#c3c3c3]'} text-white py-2 px-4 rounded-full transition cursor-pointer`} onClick={registerHandler}>
              Create Account
            </button>
          </div>)}

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="px-3 text-[#666666]">OR</div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Social buttons */}
            <button className="cursor-pointer w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-[#666666] py-2 px-4 rounded-full hover:bg-gray-50 transition" onClick={RegisterUsingGoogle}>
              <FcGoogle className="text-xl" />
              <span>Continue with Google</span>
            </button>
          

        </div>
        </div>
      )}

      {login && (
        <div className="relative flex justify-center items-center min-h-screen bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-4">
          {/* Header */}
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="bg-gray-400 w-5 h-5 rounded-full mb-1"></div>
            <h1 className="text-2xl font-bold text-[#333333] mb-2 poppins-medium">Log in to your account</h1>
            <p className="poppins-regular text-[#333333]">
              Don't have an account?{' '}
              <span className="cursor-pointer underline" onClick={()=>{setlogin(false)}}>Create one</span>
            </p>
          </div>

          <div className="space-y-4 mb-6">
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#666666] mb-2">
                Your email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#666666] mb-2">
                Your Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className={`w-full ${loginBtnEnabled ? 'bg-[#505b9a]' :'bg-[#c3c3c3]'} text-white py-2 px-4 rounded-full transition cursor-pointer`} onClick={loginHandler}>
              {loginBtnLoader ? 'Log in' : <ScaleLoader color="#ffffff" height={10} width={5} radius={2} margin={2} />}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="px-3 text-[#666666]">OR</div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Social buttons */}
          
            
            <button className="cursor-pointer w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-[#666666] py-2 px-4 rounded-full hover:bg-gray-50 transition" onClick={RegisterUsingGoogle}>
              <FcGoogle className="text-xl" />
              <span>Continue with Google</span>
            </button>
          

        </div>
      </div>
      )}
    </div>
  );
};

export default Auth;