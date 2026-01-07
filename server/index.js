const express=require('express');
const app=express();
const cors=require('cors');
const coookieParser=require('cookie-parser');
const router=require('./routes/route');
const mongoose=require('mongoose');
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
}).catch((err)=>{   
    console.log("Error connecting to MongoDB", err);
});

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
