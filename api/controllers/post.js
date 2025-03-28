const mongoose = require("mongoose");
const Post = require("../models/post");
const { ForbiddenError } = require("@casl/ability");
const PostCat = require("../models/post_cat");
const config = require("../config/index");
const User = require("../models/user");

exports.getHomePosts = async (req, res) => {
  try {
   
    const cat = await PostCat.find({ isFeature: true }).sort({ index: "desc" });

    const allPostPerCat = [];

    for (const category of cat) {
      const posts = await Post.find({
        categories: category._id,
        isActive: true,
      });

      allPostPerCat.push({
        id: category._id,
        name: category.name,
        slug: category.slug,
        index: category.index,
        posts: posts,
      });
    }

    // Sort the final array by `index` in descending order
    allPostPerCat.sort((a, b) => a.index - b.index);

    const newBlogs = await Post.aggregate([
      { $match: { isActive: true, isFeature: true  } },
      { $sort: { index: -1 } },
      { $limit: 9 },
      {
        $lookup: {
          from: "postcats", // Correct collection name for PostCat
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },
    ]);
    res.status(200).json({
      message: "this is all posts",
      success: true,
      allPostPerCat,
      newBlogs,
    });
  } catch (err) {
    res.status(500).json({
      message: "Cant get posts",
      error: err,
      success: false,
    });
  }
};

exports.getHomePostsNew = async (req, res) => {
  try {
    const onPost = await Post.find()
      .sort({ createdAt: "desc" })
      .select("featureImg title short slug createdAt")
      .skip() // Trong post đầu tiên sẽ bỏ qua giá trị là 0
      .limit(3);
    const onPages = Page.find({ isFeature: true })
      .sort({ createdAt: "desc" })
      .limit(3);
    const [posts, pages] = await Promise.all([onPost, onPages]);
    res.status(200).json({
      message: "this is all posts",
      success: true,
      posts,
      pages,
    });
  } catch (err) {
    res.status(500).json({
      message: "Cant get posts",
      error: err,
      success: false,
    });
  }
};
exports.postByCat = async (req, res) => {
  const { cat } = req.params;
  try {
    const perPage = parseInt(req.query.perPage) || 20;
    const page = parseInt(req.query.page) || 1;

    const catId = await PostCat.findOne({ slug: cat });
    if (!catId) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const total = await Post.countDocuments({
      $and: [{ isActive: true }, { categories: catId._id }],
    });

    const posts = await Post.find({
      $and: [{ isActive: true }, { categories: catId._id }],
    })
      .populate("categories")
      .sort({ createdAt: -1 }) // Use -1 for descending order
      .skip(perPage * (page - 1))
      .limit(perPage);
    const newBlogs = await Post.aggregate([
      { $match: { isActive: true } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "postcats", // Correct collection name for PostCat
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },
    ]);
    res.status(200).json({
      success: true,
      total, // Corrected total count
      posts,
      catId,
      blogs: posts, // Duplicate of `posts`, consider removing
      newBlogs,
      catId,
    });
  } catch (err) {
    console.error("Error fetching posts by category:", err);
    res.status(500).json({
      success: false,
      message: "Can't get products",
      error: err.message,
    });
  }
};

exports.postByUser = async (req, res) => {
  const { _id } = req.user;
  try {
    const perPage = parseInt(req.query.perPage) || 20;
    const page = parseInt(req.query.page) || 1;

    const total = await Post.countDocuments({
      $and: [{ user: _id }],
    });

    const posts = await Post.find({
      $and: [{ user: _id }],
    })
      .sort({ createdAt: -1 }) // Use -1 for descending order
      .skip(perPage * (page - 1))
      .limit(perPage)
      .populate("categories");
    res.status(200).json({
      success: true,
      total, // Corrected total count
      posts,
      blogs: posts, // Duplicate of `posts`, consider removing
    });
  } catch (err) {
    console.error("Error fetching posts by category:", err);
    res.status(500).json({
      success: false,
      message: "Can't get products",
      error: err.message,
    });
  }
};

exports.postByManager = async (req, res) => {
  const { _id } = req.user;
  try {
    const user =  await User.findById({_id})
    console.log(user.categories)
    const perPage = parseInt(req.query.perPage) || 20;
    const page = parseInt(req.query.page) || 1;

    // Fetch total count of posts that belong to at least one of the user's categories
    const total = await Post.countDocuments({
      categories: { $in: user.categories }, // Matches posts that have at least one category from the user
    });

    // Fetch posts
    const posts = await Post.find({
      categories: { $in: user.categories },
    })
      .sort({ createdAt: -1 }) // Sort newest first
      .skip(perPage * (page - 1))
      .limit(perPage)
      .populate("categories");

    res.status(200).json({
      success: true,
      total, 
      posts, // Removed the redundant `blogs`
    });
  } catch (err) {
    console.error("Error fetching posts by category:", err);
    res.status(500).json({
      success: false,
      message: "Can't get posts",
      error: err.message,
    });
  }
};


exports.getPosts = async (req, res) => {
  const { perPage = 20, page = 1, user, q, category } = req.body; // Extract from body
  const { feature } = req.query; // Extract feature from query parameters

  try {
    const query = {};

    if (user) {
      query.user = user; // Filter by user if provided
    }

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } }, // Case-insensitive search in title
        { content: { $regex: q, $options: "i" } }, // Case-insensitive search in content
      ];
    }

    if (feature === "feature") {
      query.isFeature = true; // Filter by isFeature if feature param is in query
    }

    if (category) {
      // Find category by slug and get its ObjectId
      const categoryDoc = await PostCat.findOne({ slug: category }).select("_id");

      if (categoryDoc) {
        query.categories = categoryDoc._id; // Filter posts with this category
      } else {
        return res.status(404).json({
          message: "Category not found",
          success: false,
        });
      }
    }

    const total = await Post.countDocuments(query); // Count filtered posts
    const posts = await Post.find(query)
      .populate("categories", "name slug")
      .populate("user", "username _id")
      .sort({ index: -1, createdAt: "desc" }) // Sort by index (desc), then by createdAt (desc)
      .skip(perPage * (page - 1)) // Correct pagination calculation
      .limit(perPage);

    res.status(200).json({
      message: "Fetched posts successfully",
      total,
      posts,
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: "Cannot fetch posts",
      error: err.message,
      success: false,
    });
  }
};


exports.createpost = async (req, res) => {
  try {
    const {
      title,
      desc,
      categories,
      isActive,
      index,
      short,
      featureImg,
      isFeature,
      slug,
      file,
    } = req.body;
    const post = new Post({
      title,
      desc,
      user: req.user._id,
      isFeature,
      isActive,
      index,
      short,
      slug,
      featureImg,
      file,
    });
    // post.featureImg = null
    // post.featureImg = featureImg
    if (typeof categories === "object") {
      const categoriesFormat = categories.map((obj) => {
        const rObj = {};
        // eslint-disable-next-line dot-notation
        rObj["_id"] = obj;
        return rObj;
      });
      post.categories = categoriesFormat;
    } else {
      post.categories.push({
        _id: categories,
      });
    }
    await post.save();
    res.status(200).json({
      success: true,
      post,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
};

exports.userCreatepost = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  try {
    const { title, desc, categories, short, featureImg, slug, file } = req.body;
    const post = new Post({
      title,
      desc,
      user: req.user._id,
      short,
      slug,
      featureImg,
      file,
      index: 0,
    });
    // post.featureImg = null
    // post.featureImg = featureImg
    console.log(req.user.rule)
    if(req.user.rule === 'editor' || req.user.rule === 'manager'  || req.user.rule === 'admin' ){
      post.isActive = true
    } else {
      post.isActive = false
    }
    if (typeof categories === "object") {
      const categoriesFormat = categories.map((obj) => {
        const rObj = {};
        // eslint-disable-next-line dot-notation
        rObj["_id"] = obj;
        return rObj;
      });
      post.categories = categoriesFormat;
    } else {
      post.categories.push({
        _id: categories,
      });
    }
    ForbiddenError.from(ability).throwUnlessCan("update", post);

    await post.save();

    res.status(200).json({
      success: true,
      post,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err,
    });
  }
};

exports.adminGetpost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findOne({ _id: id })
      .populate("user", "username rule") // Populate post owner
      .populate("revisions.user", "username"); // Populate username in revisions

    res.status(200).json({
      success: true,
      post,
    });
  } catch (err) {
    res.status(500).json({
      message: "Post not found",
    });
  }
};


exports.userGetpost = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  try {
    const id = await req.params.id;
    const post = await Post.findOne({ _id: id }).populate();
    ForbiddenError.from(ability).throwUnlessCan("read", post);
    res.status(200).json({
      success: true,
      post,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "post not found",
    });
  }
};

// lay san pham theo id
exports.postsGetpost = async (req, res) => {
  try {
    const slug = req.params.id;

    // Find the post by slug and populate categories and user
    const post = await Post.findOne({ slug, isActive: true })
      .populate("categories")
      .populate("user", "username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Ensure there are categories in the post
    const categoryIds = post.categories.map((cat) => cat._id);

    // Fetch related blogs
    const blogs = await Post.aggregate([
      {
        $match: {
          categories: { $in: categoryIds }, // Match any category from the post
          _id: { $ne: post._id }, // Exclude the current post
          isActive: true,
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "postcats", // Correct collection name for PostCat
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },
    ]);

    // Fetch latest blogs excluding the current post
    const newBlogs = await Post.aggregate([
      {
        $match: {
          isActive: true,
          _id: { $ne: post._id }, // Exclude the current post
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "postcats", // Correct collection name for PostCat
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      post,
      blogs,
      newBlogs,
      blog: post,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Post not found" });
  }
};
exports.updatepostByPut = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      desc,
      categories,
      isActive,
      index,
      short,
      featureImg,
      slug,
      file,
      isFeature,
    } = req.body;

    const userId = req.user._id; // Assuming user authentication middleware is applied

    // Ensure file is stored as an array of objects with `path`
    let fileArray = [];
    if (Array.isArray(file)) {
      fileArray = file.map((f) => ({ path: f.path })); // Normalize file structure
    } else if (file?.path) {
      fileArray = [{ path: file.path }]; // Convert single file to an array
    }

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          desc,
          short,
          isActive,
          index,
          slug,
          featureImg,
          file: fileArray, // Ensure files are stored correctly
          isFeature,
        },
        $push: { revisions: { user: userId, timestamp: new Date() } }, // Add revision history
      },
      { new: true, upsert: true }
    ).populate("user", "username rule") // Populate post owner
    .populate("revisions.user", "username"); // Populate username in revisions

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Update categories separately
    post.categories = [];
    if (Array.isArray(categories)) {
      post.categories = categories.map((cat) => ({ _id: cat }));
    } else if (categories) {
      post.categories.push({ _id: categories });
    }

    await post.save()

    res.status(200).json({
      post,
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};


exports.userUpdatepostByPut = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { title, desc, categories, short, featureImg, slug, file } = req.body;

    // Find the post and check if the user is the owner
    const post = await Post.findOneAndUpdate(
      { _id: id, user: userId },
      {
        $set: { title, desc, short, slug, featureImg, file },
        $push: { revisions: { user: userId, timestamp: new Date() } }, // Track updates
      },
      { new: true, upsert: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found or unauthorized" });
    }

    // Set `isActive` based on user role
    if (["editor", "manager", "admin"].includes(req.user.rule)) {
      post.isActive = true;
    } else {
      post.isActive = false;
    }

    // Update categories
    post.categories = Array.isArray(categories)
      ? categories.map((catId) => ({ _id: catId }))
      : [{ _id: categories }];

    await post.save();

    res.status(200).json({
      post,
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};


exports.postDelete = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  try {
    // eslint-disable-next-line prefer-destructuring
    const id = req.params.id;
    const post = await Post.findById({ _id: id }).exec();
    ForbiddenError.from(ability).throwUnlessCan("delete", post);
    await post.remove();
    res.status(200).json({
      success: true,
      message: "post has been delete",
    });
  } catch (err) {
    res.status(500).json({
      message: err,
      success: false,
    });
  }
  // eslint-disable-next-line eol-last
};

exports.postActiveMulti = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    let result = ids.map((a) => a);
    const update = await Post.updateMany(
      { _id: { $in: result } },
      {
        $set: {
          isActive: isActive,
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
};

exports.postDeleteMulti = async (req, res) => {
  try {
    const { ids } = req.body;
    let result = ids.map((a) => a);

    const update = await Post.deleteMany(
      { _id: { $in: result } },
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
};

exports.searchBlogs = async (req, res) => {
  try {
    const text = req.query.text?.trim() || ""; // Get the search text
    const titleFilter = text
      ? { title: { $regex: new RegExp(text, "i") } }
      : {}; // Case-insensitive partial match

    const perPage = parseInt(req.query.perPage, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const blogs = await Post.aggregate([
      { $match: { isActive: true, ...titleFilter } },

      { $skip: (page - 1) * perPage }, // Skip results for pagination
      { $limit: perPage }, // Limit results per page
      {
        $lookup: {
          from: "postcats", // Correct collection name for PostCat
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },
    ]);
    const newBlogs = await Post.aggregate([
      { $match: { isActive: true } },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "postcats", // Correct collection name for PostCat
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },
    ]);
    res.json({
      success: true,
      blogs,
      newBlogs,
    });
  } catch (err) {
    res.status(500).json({
      message: "Please check correctness and try again",
      error: err,
      success: false,
    });
  }
};

exports.authorBlogs = async (req, res) => {
  const { user } = req.params;
  try {
    const perPage = parseInt(req.query.perPage) || 20;
    const page = parseInt(req.query.page) || 1;
    const userId = await User.findOne({ username: user }).select("username rule")
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }
    console.log(req.user)
    if (!req.user.rule || req.user.rule === "user" ) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    const total = await Post.countDocuments({
      $and: [{ isActive: true }, { user: userId._id }],
    });

    const posts = await Post.find({
      $and: [{ isActive: true }, { user: userId._id }],
    })
      .populate("categories")
      .sort({ createdAt: -1 }) // Use -1 for descending order
      .skip(perPage * (page - 1))
      .limit(perPage);
    const newBlogs = await Post.aggregate([
      { $match: { isActive: true } },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "postcats", // Correct collection name for PostCat
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },
    ]);
    res.status(200).json({
      success: true,
      total, // Corrected total count
      posts,
      blogs: posts, // Duplicate of `posts`, consider removing
      newBlogs,
      userId
    });
  } catch (err) {
    console.error("Error fetching posts by category:", err);
    res.status(500).json({
      success: false,
      message: "Can't get products",
      error: err.message,
    });
  }
};
