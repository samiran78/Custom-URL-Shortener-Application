
const User = require('../models/Usermodel'); // Use a singular, meaningful name
//uuid:
const { v4: uuidv4 } = require('uuid');
const {setUser}  = require('../service/auth');


async function handleuserCreate(req, res) {
    // const {name,email, password} = req.body;
    // await User.create({name,email,password});
    // return res.render("home");
    try {
        const { name, email, password } = req.body;
        //want to check if already email or password exists in database..
        const existingUser = await User.findOne({ email})
         if (existingUser) {
            return res.status(400).json({ message: "Email or password already exists" });
            }
        //now create new USER..
        await User.create({ name, email, password });
         // Step 5: Render the home page or return a success message
        return res.render("home"); // Redirect instead of render
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).send("Internal Server Error");
    }
}

async function userlogin(req, res) {
    // const {name,email, password} = req.body;
    // await User.create({name,email,password});
    // return res.render("home");
    try {
        const { email, password } = req.body;
        // if(!email && !password){
        //     return res.status(400).send("Email and password are required buddy!!");
        // }
        // if(email == User.find() && password == User.find()){
        //     return res.render("home");
        //     }
        const validuser = await User.findOne({ email, password });
        if (!validuser) {
         return  res.render("login", {
                message: "Invalid email or password"
            })
        }
        // const sessionID = uuidv4();//have to store sessionID with user object --->stateful
        // ----->STATELESS
      const TicketToken =   setUser(validuser._id, validuser);  
        // Set the session ID in cookies
        // res.cookie("sessionID", sessionID, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 1-day expiry ----->stateful
        // ----->STATELESS
        // res.cookie("tokenn",TicketToken);
         // 🔍 Debugging: Log Token Before Setting It
         console.log("Generated Token:", TicketToken);
        res.cookie("token", TicketToken, {
            httpOnly: true, 
            // secure: false,  // ❌ Remove this in production
            // sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });
        
        console.log("Set-Cookie Header:", res.getHeaders()['set-cookie']); // 🔍 Log Set-Cookie
        // res.send("Login successful. Check cookies in your browser.");
        res.render("home");  // ✅ Redirect instead of rendering
        // return res.render("home");:
    } catch (error) {
        console.error("Error Finding User:", error);
        return res.status(500).send("Internal Server Error");
    }
}

module.exports = {
    handleuserCreate,
    userlogin
} 