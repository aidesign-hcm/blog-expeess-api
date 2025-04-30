const express = require('express');

const router = express.Router();
const passport = require('passport');
const pageController = require('../controllers/page');

router.get("/", pageController.getAllPages);

router.post("/all", passport.authenticate('user',{session: false}),pageController.getPages);

router.post('/', passport.authenticate('user', { session: false }), pageController.createPage);

// router.post('/user-create', passport.authenticate('user', { session: false }), postController.userCreatepost);

router.get('/admin/:id', passport.authenticate('user', { session: false }),  pageController.adminGetPage);

router.get('/:id', pageController.getPage);

router.put('/single/:id', passport.authenticate('user', { session: false }), pageController.updatePageByPut);

router.delete('/single/:id', passport.authenticate('user', { session: false }),  pageController.pageDelete);

router.put('/active-multi', passport.authenticate('user', { session: false }), pageController.pageActiveMulti);

router.patch('/delete-multi', passport.authenticate('user', { session: false }), pageController.pageDeleteMulti);

// router.post("/search", postController.searchBlogs);

// router.get("/author/:user",passport.authenticate('user', { session: false }),  postController.authorBlogs);

module.exports = router;
