const express=require('express');
const app=express();
const cors=require('cors');
const coookieParser=require('cookie-parser');
const router=require('./routes/route');
const mongoose=require('mongoose');
const weeklyDeliveryScheduler = require('./util/weeklyDeliveryScheduler');
require('dotenv').config();
const PORT=process.env.PORT || 4000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

app.use(coookieParser());
app.use(router);



mongoose.connect(process.env.mongodb_url).then(()=>{
    console.log("Connected to MongoDB");
    
    // Start the weekly delivery scheduler
    try {
        weeklyDeliveryScheduler.start();
    } catch (error) {
        console.error('Failed to start weekly delivery scheduler:', error.message);
        console.log('Server will continue without the scheduler. Install node-cron for full functionality: npm install node-cron');
    }
    
}).catch((err)=>{   
    console.log("Error connecting to MongoDB", err);
});

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
