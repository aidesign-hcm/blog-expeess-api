const express = require('express');

const router = express.Router();
const passport = require('passport');

const mediaController = require('../controllers/media');
const {verifyAdmin, verifyManager}  = require('../middleware/is-admin')

const upload = require('../middleware/upload-photo');

const uploadFile = require('../middleware/upload-file');

const cpUpload = upload.fields([{ name: 'productImage', maxCount: 6 }])

router.post('/product', passport.authenticate('user', { session: false }), upload.single('imageFile'), mediaController.resizeImage, mediaController.featureImg);

router.post('/file', passport.authenticate('user', { session: false }), uploadFile.single('file'),  mediaController.CraeteFile);

router.post('/single', passport.authenticate('user', { session: false }), upload.single('imageFile'),  mediaController.singleImg);

router.post('/single-noresize', passport.authenticate('user', { session: false }), upload.single('imageFile'),  mediaController.singleImgNoSize);

router.post('/review', passport.authenticate('user', { session: false }), upload.single('imageFile'), mediaController.reviewImg);

router.post('/multi', passport.authenticate('user', { session: false }), cpUpload, mediaController.multiImg);

router.post('/multi-nocut', passport.authenticate('user', { session: false }), cpUpload, mediaController.multiImgNoCut);

router.delete('/product', passport.authenticate('user', { session: false }), mediaController.deletefeatureImg);

module.exports = router;