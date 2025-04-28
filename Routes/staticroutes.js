const express = require('express');
const router = express.Router();
const urls = require('../models/url');
const { restrictedTologin } = require('../middlewares/AuthenticationLogic');
//rendering ejs to home page..
router.get('/', restrictedTologin(["NORMAL"]),async (req, res) => {
   if(!req.user){
     return res.render('login');
   }
   const allurals = await urls.find({createdBywhom: req.user.id});
   return res.render('home', {
      allurals: allurals
   });
});

//as a ADMIN, HE/SHE COULD SEE EVERY URLs...
router.get('/admin/urls',restrictedTologin(["ADMIN"]),async (req, res) =>{
  const allurals = await urls.find();
  return res.render('adminurls', {
    allurals: allurals
    });
})

router.get('/signup', (req,res)=>{
  return  res.render("signUp");
})
// router.post('/login', userlogin);
router.get('/login', (req,res)=>{
   return  res.render("login");
 })
module.exports = router;