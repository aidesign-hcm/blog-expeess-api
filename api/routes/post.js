const express = require('express');

const router = express.Router();
const passport = require('passport');
const postController = require('../controllers/post');
const {verifyAdmin, verifyManager}  = require('../middleware/is-admin')

router.get("/home", postController.getHomePosts);

router.get("/home-new", postController.getHomePostsNew);

router.get('/by-cat/:cat', postController.postByCat);

router.get('/by-user',  passport.authenticate('user',{session: false}), postController.postByUser);

router.get('/by-manager',  passport.authenticate('user',{session: false}), postController.postByManager);

router.post("/all", passport.authenticate('user',{session: false}), postController.getPosts);

router.post('/', passport.authenticate('user', { session: false }), postController.createpost);

router.post('/user-create', passport.authenticate('user', { session: false }), postController.userCreatepost);

router.get('/admin/:id', passport.authenticate('user', { session: false }), verifyAdmin, postController.adminGetpost);

router.get('/user/:id', passport.authenticate('user', { session: false }), postController.userGetpost);

router.get('/:id', postController.postsGetpost);

router.put('/single/:id', passport.authenticate('user', { session: false }), postController.updatepostByPut);

router.put('/user/single/:id', passport.authenticate('user', { session: false }), postController.userUpdatepostByPut);

router.delete('/single/:id', passport.authenticate('user', { session: false }), postController.postDelete);

router.put('/active-multi', passport.authenticate('user', { session: false }), postController.postActiveMulti);

router.patch('/delete-multi', passport.authenticate('user', { session: false }), postController.postDeleteMulti);

router.post("/search", postController.searchBlogs);

router.get("/author/:user",passport.authenticate('user', { session: false }),  postController.authorBlogs);

module.exports = router;
