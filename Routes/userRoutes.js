const express = require('express');
const router = express.Router();
const { handleuserCreate,userlogin } = require('../Controllers/userController');
router.post('/', handleuserCreate);
 router.post('/login', userlogin);


module.exports = router;