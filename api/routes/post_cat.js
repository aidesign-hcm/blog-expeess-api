const express = require("express");
const router = express.Router();
const PostCat = require("../models/post_cat");
const { ForbiddenError } = require("@casl/ability");
const passport = require("passport");
const config = require("../config/index");
const User = require("../models/user");

const {
  buildPostCatAncestors,
  buildPostHierarchyAncestors,
} = require("../middleware/build-post-cat-ancestors");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  async (req, res) => {
    const ability = defineAbilityFor(req.user);
    try {
      let parent = req.body.parent ? req.body.parent : null;
      const {
        name,
        slug,
        index,
        content,
        featureImg,
        isFeature,
        translations,
        isDefault,
      } = req.body;
      const category = new PostCat({
        name,
        slug,
        index,
        content,
        parent,
        featureImg,
        isFeature,
        translations,
        isDefault,
      });
      buildPostCatAncestors(category._id, parent);
      ForbiddenError.from(ability).throwUnlessCan("create", category);
      await category.save();
      res.status(200).json({
        success: true,
        category,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err,
      });
    }
  }
);

router.get("/single/:id", async (req, res) => {
  try {
    const category = await PostCat.findById({ _id: req.params.id })
      // .populate("tags")
      .exec();

    res.status(201).send({ success: true, category });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
});

router.get(
  "/admin/:id",
  passport.authenticate("user", { session: false }),
  async (req, res) => {
    try {
      const category = await PostCat.findById({ _id: req.params.id })
        // .populate("tags")
        .exec();
      res.status(200).send({ success: true, category });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err,
      });
    }
  }
);

router.delete(
  "/:id",
  passport.authenticate("user", { session: false }),
  async (req, res) => {
    const ability = defineAbilityFor(req.user);
    try {
      const category = await PostCat.findById({ _id: req.params.id });
      ForbiddenError.from(ability).throwUnlessCan("delete", category);
      await category.remove();
      res.status(200).send({ success: true });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err,
      });
    }
  }
);

router.put(
  "/edit-cat",
  passport.authenticate("user", { session: false }),
  async (req, res) => {
    const ability = defineAbilityFor(req.user);

    try {
      const {
        name,
        slug,
        index,
        _id,
        content,
        parent,
        featureImg,
        isFeature,
        isDefault,
      } = req.body;

      const category = await PostCat.findById({ _id });
      ForbiddenError.from(ability).throwUnlessCan("update", category);
      (category.name = name), (category.slug = slug);
      category.index = index;
      (category.content = content), (category.featureImg = featureImg);
      category.isFeature = isFeature;
      category.isDefault = isDefault;
      if (parent) {
        category.parent = parent;
        buildPostHierarchyAncestors(category._id, parent);
      }

      await category.save();
      res.status(200).json({
        success: true,
        category,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err,
      });
    }
  }
);

router.post("/get-all", async (req, res) => {
  const { perPage } = req.body || 50;
  const page = parseInt(req.body.page) || 1;
  try {
    const onTotal = PostCat.countDocuments();
    const onCategories = PostCat.find()
      .populate("parent", "name")
      .sort({ createdAt: "desc" })
      .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
      .limit(perPage);
    const [total, categories] = await Promise.all([onTotal, onCategories]);
    res.status(200).json({ success: true, categories, total });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const categories = await PostCat.find().exec();
    res.status(200).send({ success: true, categories });
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get(
  "/by-user",
  passport.authenticate("user", { session: false }),
  async (req, res) => {
    try {
      const { _id } = req.user;

      // Get the categories for the user
      const findCategories = await User.findById(_id).select("categories");

      let categories = [];

      if (findCategories && findCategories.categories.length > 0) {
        categories = await PostCat.find({
          _id: { $in: findCategories.categories },
        }).exec();
      }

      // Find categories where isDefault is true
      const categoriesDefault = await PostCat.find({ isDefault: true }).exec();

      // Merge both lists, ensuring no duplicates
      const categoryIds = new Set(categories.map((cat) => cat._id.toString()));
      categoriesDefault.forEach((cat) => {
        if (!categoryIds.has(cat._id.toString())) {
          categories.push(cat);
        }
      });

      res.status(200).send({ success: true, categories });
    } catch (err) {
      res.status(500).send(err);
    }
  }
);

router.get("/home", async (req, res) => {
  try {
    const categories = await PostCat.aggregate([
      { $match: { isFeature: true } },
      { $limit: 20 },
    ]).exec();
    res.status(201).send({ success: true, categories });
  } catch (err) {
    res.status(500).send(err);
  }
});

router.put(
  "/active-multi",
  passport.authenticate("account", { session: false }),
  async (req, res) => {
    try {
      const { categories, isActive } = req.body;
      let result = categories.map((a) => a._id);
      const update = await PostCat.updateMany(
        { _id: { $in: result } },
        {
          $set: {
            isFeature: isActive,
          },
        },
        { upsert: true }
      );
      res.status(200).json({
        success: true,
      });
    } catch (err) {
      res.status(404).json({
        error: err,
      });
    }
  }
);

router.post(
  "/search",
  passport.authenticate("account", { session: false }),
  async (req, res) => {
    const title = { $regex: new RegExp(req.body.title, "i") };
    try {
      const categories = await PostCat.aggregate([
        { $match: { name: title } },
        { $limit: 20 },
      ]);
      res.json({
        success: true,
        categories,
      });
    } catch (err) {
      res.status(500).json({
        message: "Please check correctness and try again",
        error: err,
        success: false,
      });
    }
  }
);

module.exports = router;
