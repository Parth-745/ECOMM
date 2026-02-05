const User=require('../models/User');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const crypto=require('crypto');
const Otp=require('../models/Otp');
const Admin=require('../models/Admin');
const DeliveryAgent=require('../models/DeliveryAgent');
const mailSender=require('../util/mailSender');

require('dotenv').config();


exports.SendOtp=async(req,res)=>{
    try{
        const {email}=req.body;

        const exist = await User.findOne({email});
        console.log(email);
        if(exist){
            return res.status(400).json({
                success:false,
                message:"User already exist with this credentials"
            })
        }

        // Check if MAIL_USER and MAIL_PASS are set
        if(!process.env.MAIL_USER || !process.env.MAIL_PASS){
            console.log("Email credentials not configured in .env file");
            return res.status(500).json({
                success:false,
                message:"Email service not configured. Please contact admin.",
            })
        }

        const otp=crypto.randomInt(100000,1000000);

        await Otp.create({
            otp:otp,
            email:email
        }); 
        
        const mailResult = await mailSender(email,"Verify your email",otp);

        if(!mailResult.success){
            console.log("Mail sending failed:", mailResult.error);
            return res.status(500).json({
                success:false,
                message:"Failed to send OTP. Please try again.",
            })
        }

        return res.status(200).json({
            success:true,
            message:"Otp is sent to your email",
            otp:otp
        })

    }
    catch(e){
        console.log("SendOtp Error:", e);
        return res.status(500).json({
            success:false,
            message:"Internal server error during otp generation",
        })
    }
}

exports.MatchOtp=async(req,res)=>{
    try{
        const {email,otp}=req.body;
        const otpData = await Otp.findOne({ email: email, otp: otp });
        if(!otpData){
            return res.status(400).json({
                success:false,
                message:"Invalid OTP"
            })
        }
        if(otpData.expiresAt < Date.now()){
            return res.status(400).json({
                success:false,
                message:"OTP expired"
            })
        }

        await Otp.findOneAndDelete({email:email,otp:otp});

        return res.status(200).json({
            success:true,
            message:"Otp verified successfully",
        });


    }
    catch(e){
        console.log(e);
        return res.status(500).json({
            success:false,
            message:"Internal server error during otp generation",
        })
    }
}

exports.register=async(req,res)=>{
    try{
        const {username,email,password,firebaseUid}=req.body;
        console.log(req.body);
        const exist = await User.findOne({firebaseUid});
        console.log(exist);

        if(exist){
            return res.status(400).json({
                success:true,
                message:"User already exist with this credentials"
            })
        }

        const ex=await User.findOne({email});
        console.log(ex);
        if(ex){
            return res.status(400).json({
                success:false,
                message:"User already exist with this email"
            })
        }

        
        let hashedPassword;
        if(password) hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firebaseUid:firebaseUid,
            username:username || null,
            email:email,
            password:hashedPassword || null,
        });

        console.log("New user created:", user);

        return res.status(200).json({
            success:true,
            message:"User registered successfully",
            user:user
        });


    }
    catch(e){
        console.log(e);
        return res.status(500).json({
            success:false,
            message:"Internal server error during registration",
        })
    }
}

exports.login=async(req,res)=>{
    try{
        const {username,email,password}=req.body;

        if((!email || !username ) && !password){
            return res.status(400).json({
                success:false,
                message:"Please provide email and password"
            })
        }

        const user = await User.findOne({
        $or: [{ username }, { email }]
        });

        if(!user){
            return res.status(400).json({
                success:false,
                message:"User not found with this email"
            })
        }

        const isMatch=await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Invalid credentials"
            })
        }

        const payload={
            id:user._id,
            username:user.username,
            email:user.email
        }
        const token=jwt.sign(payload,process.env.JWT_SECRET);
        const options={
            expires:new Date(Date.now()+3*24*60*60*1000),
            httpOnly:true,
        }

        console.log("User logged in:", token);
        return res.status(200).cookie("token",token,options).json({
            success:true,
            message:"User logged in successfully",
            user:user
        });
    }
    catch(e){
        console.log(e);
        return res.status(500).json({
            success:false,
            message:"Internal server error during login",
        })
    }
}

exports.AdminSignup=async(req,res)=>{
    try{
        const {name,email,password}=req.body;

        if(!name || !email || !password){
            return res.status(400).json({
                success:false,
                message:"Please provide username, email and password"
            })
        }

        const exist = await Admin.findOne({email});

        if(exist){
            return res.status(400).json({
                success:false,
                message:"User already exist with this credentials"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await Admin.create({
            name,email,
            password:hashedPassword
        });

        return res.status(201).json({
            success:true,
            message:"Admin registered successfully"
        });
    }
    catch(e){
        console.log(e);
        return res.status(500).json({
            success:false,
            message:"Internal server error during admin signup",
        })
    }
}

exports.AdminLogin=async(req,res)=>{
    try{
        const {email,password}=req.body;

        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Please provide email and password"
            })
        }

        const admin = await Admin.findOne({email});

        if(!admin){
            return res.status(400).json({
                success:false,
                message:"Admin not found with this email"
            })
        }

        const isMatch=await bcrypt.compare(password,admin.password);

        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Invalid credentials"
            })
        }

        const payload={
            id:admin._id,
            name:admin.name,
            email:admin.email,
            role:'admin'      }
        const token=jwt.sign(payload,process.env.JWT_SECRET);
        const options={
            expires:new Date(Date.now()+3*24*60*60*1000),
            httpOnly:true,
        }

        return res.status(200).cookie("token",token,options).json({
            success:true,
            message:"Admin logged in successfully",
            admin:admin
        });
    }
    catch(e){
        console.log(e);
        return res.status(500).json({
            success:false,
            message:"Internal server error during admin login",
        })
    }
}

exports.getUser=async(req,res)=>{
    try{
        const userId=req.payload.id;
        // console.log("Fetching user with ID:", userId);
        const user=await User.findById(userId).select('-password');

        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        return res.status(200).json({
            success:true,
            user:user
        });
    }
    catch(e){
        console.log(e);
        return res.status(500).json({
            success:false,
            message:"Internal server error while fetching user",
        })
    }
}

// Delivery Agent Login
exports.DeliveryAgentLogin = async(req,res) => {
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Please provide email and password"
            })
        }

        const deliveryAgent = await DeliveryAgent.findOne({email}).select('+password');

        if(!deliveryAgent){
            return res.status(400).json({
                success:false,
                message:"Delivery agent not found with this email"
            })
        }

        if(deliveryAgent.status === 'suspended'){
            return res.status(403).json({
                success:false,
                message:"Your account has been suspended. Please contact admin."
            })
        }

        const isMatch = await bcrypt.compare(password, deliveryAgent.password);

        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Invalid credentials"
            })
        }

        const payload = {
            id: deliveryAgent._id,
            name: deliveryAgent.name,
            email: deliveryAgent.email,
            role: 'delivery_agent'
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        const options = {
            expires: new Date(Date.now() + 3*24*60*60*1000),
            httpOnly: true,
        }

        return res.status(200).cookie("token", token, options).json({
            success:true,
            message:"Delivery agent logged in successfully",
            token: token,
            deliveryAgent: deliveryAgent
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Internal server error during login"
        })
    }
}

// Delivery Agent Signup
exports.DeliveryAgentSignup = async(req,res) => {
    try{
        const {name, email, password, phone, address, vehicle, vehicleNumber} = req.body;

        // Validation
        if(!name || !email || !password || !phone || !address || !vehicle || !vehicleNumber){
            return res.status(400).json({
                success:false,
                message:"Please provide all required fields"
            })
        }

        // Check if delivery agent already exists
        const existingAgent = await DeliveryAgent.findOne({email});
        if(existingAgent){
            return res.status(400).json({
                success:false,
                message:"Delivery agent already exists with this email"
            })
        }

        // Create new delivery agent
        const deliveryAgent = await DeliveryAgent.create({
            name,
            email,
            password,
            phone,
            address,
            vehicle,
            vehicleNumber
        });

        const payload = {
            id: deliveryAgent._id,
            name: deliveryAgent.name,
            email: deliveryAgent.email,
            role: 'delivery_agent'
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        const options = {
            expires: new Date(Date.now() + 3*24*60*60*1000),
            httpOnly: true,
        }

        return res.status(201).cookie("token", token, options).json({
            success:true,
            message:"Delivery agent registered successfully",
            token: token,
            deliveryAgent: deliveryAgent
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Internal server error during registration"
        })
    }
}

// Get Delivery Agent Data
exports.getDeliveryAgentData = async(req,res) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if(!token) {
            return res.status(401).json({
                success:false,
                message:"No token provided"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const deliveryAgent = await DeliveryAgent.findById(decoded.id);

        if(!deliveryAgent) {
            return res.status(404).json({
                success:false,
                message:"Delivery agent not found"
            })
        }

        return res.status(200).json({
            success:true,
            deliveryAgent:deliveryAgent
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

// Update Delivery Agent Details
exports.updateDeliveryAgentDetails = async(req,res) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if(!token) {
            return res.status(401).json({
                success:false,
                message:"No token provided"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const {name, phone, address, vehicle, vehicleNumber} = req.body;

        const deliveryAgent = await DeliveryAgent.findByIdAndUpdate(
            decoded.id,
            {
                name,
                phone,
                address,
                vehicle,
                vehicleNumber
            },
            {new: true, runValidators: true}
        );

        if(!deliveryAgent) {
            return res.status(404).json({
                success:false,
                message:"Delivery agent not found"
            })
        }

        return res.status(200).json({
            success:true,
            message:"Details updated successfully",
            deliveryAgent:deliveryAgent
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error updating details"
        })
    }
}

// Activate Groovo Plus subscription
exports.activateGroovoPlus = async (req, res) => {
    try {
        // Get user from Firebase UID
        const firebaseUid = req.payload.uid;
        const user = await User.findOne({ firebaseUid });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if user already has active subscription
        if (user.isGroovoPlusSubscriptionActive && user.isGroovoPlusSubscriptionActive()) {
            return res.status(400).json({
                success: false,
                message: "User already has an active Groovo Plus subscription"
            });
        }

        // Activate subscription (this will set dates and mark as active)
        await user.startGroovoPlusSubscription();

        return res.status(200).json({
            success: true,
            message: "Groovo Plus subscription activated successfully",
            subscription: {
                isActive: user.isGroovoPlusActive,
                startDate: user.subscriptionStartDate,
                endDate: user.subscriptionEndDate
            }
        });

    } catch (error) {
        console.log("Error activating Groovo Plus subscription:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to activate subscription. Please try again."
        });
    }
};