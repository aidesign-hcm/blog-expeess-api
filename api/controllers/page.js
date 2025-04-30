const mongoose = require("mongoose");
const Page = require("../models/page");
const Post = require("../models/post");
const { ForbiddenError } = require("@casl/ability");
const config = require("../config/index");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { post } = require("../routes/page");

exports.getAllPages = async (req, res) => {
  try {
    const pages = await Page.find()
      .populate("user", "username _id")
      .limit(20);

    res.status(200).json({
      message: "Fetched posts successfully",
      pages,
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
exports.getPages = async (req, res) => {
  const { perPage = 20, page = 1, user, q } = req.body; // Extract from body
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
    const total = await Page.countDocuments(query); // Count filtered posts
    const pages = await Page.find(query)
      .populate("user", "username _id")
      .sort({ index: -1, createdAt: "desc" }) // Sort by index (desc), then by createdAt (desc)
      .skip(perPage * (page - 1)) // Correct pagination calculation
      .limit(perPage);

    res.status(200).json({
      message: "Fetched posts successfully",
      total,
      pages,
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
exports.createPage = async (req, res) => {
  try {
    const {
      title,
      desc,
      isActive,
      index,
      short,
      slug,
    } = req.body;
    const page = new Page({
      title,
      desc,
      user: req.user._id,
      isActive,
      index,
      short,
      slug,
    });
    await page.save();
    res.status(200).json({
      success: true,
      page,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
};

exports.adminGetPage = async (req, res) => {
  try {
    const id = req.params.id;
    const page = await Page.findOne({ _id: id })
      .populate("user", "username rule") // Populate page owner
      .populate("revisions.user", "username"); // Populate username in revisions

    res.status(200).json({
      success: true,
      page,
    });
  } catch (err) {
    res.status(500).json({
      message: "Page not found",
    });
  }
};
// lay san pham theo id
exports.getPage = async (req, res) => {
  try {
    const slug = req.params.id;
    // Find the page by slug and populate categories and user
    const page = await Page.findOne({ slug, isActive: true })
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    // Fetch latest blogs excluding the current page
    const newBlogs = await Post.aggregate([
      {
        $match: {
          isActive: true,
          _id: { $ne: page._id }, // Exclude the current page
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "postcats", // Correct collection name for PageCat
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },
    ]);
    res.status(200).json({
      success: true,
      page,
      newBlogs,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Page not found" });
  }
};
exports.updatePageByPut = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      desc,
      isActive,
      index,
      short,
      slug,
    } = req.body;

    const userId = req.user._id;

    // Get the existing page
    const oldPage = await Page.findById(id).lean();
    if (!oldPage) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    // Compute field diffs
    const changes = {};
    const fieldsToCheck = {
      title,
      desc,
      short,
      isActive,
      index,
      slug,
    };

    for (const key in fieldsToCheck) {
      const newVal = fieldsToCheck[key];
      const oldVal = oldPage[key];
      const isEqual = JSON.stringify(newVal) === JSON.stringify(oldVal);

      if (!isEqual) {
        if (key === "desc" || key === "short") {
          changes[key] = { changed: true }; // only mark as changed
        } else {
          changes[key] = { old: oldVal, new: newVal };
        }
      }
    }


    // Update page in DB
    const page = await Page.findByIdAndUpdate(
      id,
      {
        $set: {
          ...fieldsToCheck,
        },
        $push: {
          revisions: {
            user: userId,
            timestamp: new Date(),
            changes,
          },
        },
      },
      { new: true }
    )
      .populate("user", "username rule")
      .populate("revisions.user", "username");

    await page.save();

    res.status(200).json({
      success: true,
      page,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

function getLocalPathFromUrl(imageUrl) {
  try {
    const parsed = new URL(imageUrl); // built-in URL parser
    // This gives you just "uploads/media/..."
    return parsed.pathname.replace(/^\/+/, ""); // remove starting slashes
  } catch (e) {
    // Fallback if it's already a relative path
    return imageUrl.replace(/^\/+/, "");
  }
}
exports.pageDelete = async (req, res) => {
  try {
    await deletePageAndMedia(req.params.id, req.user);
    res.status(200).json({ success: true, message: "Page has been deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.pageActiveMulti = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    let result = ids.map((a) => a);
    const update = await Page.updateMany(
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
const deletePageAndMedia = async (postId, user) => {
  const ability = defineAbilityFor(user);
  const page = await Page.findById(postId).exec();

  if (!page) throw new Error("Page not found");
  ForbiddenError.from(ability).throwUnlessCan("delete", page);

  // === Delete images in desc ===
  const imageRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  while ((match = imageRegex.exec(page.desc)) !== null) {
    const imgUrl = match[1];
    if (imgUrl.includes('/uploads/')) {
      const localPath = getLocalPathFromUrl(imgUrl);
      const fullPath = path.join(__dirname, '..', '..', localPath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
  }
  await page.remove();
};
exports.pageDeleteMulti = async (req, res) => {
  try {
    const { ids } = req.body;
    const deleted = [];
    const failed = [];

    for (const id of ids) {
      try {
        await deletePageAndMedia(id, req.user);
        deleted.push(id);
      } catch (err) {
        console.error(`Failed to delete page ${id}:`, err.message);
        failed.push({ id, error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      deleted,
      failed,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
    const blogs = await Page.aggregate([
      { $match: { isActive: true, ...titleFilter } },

      { $skip: (page - 1) * perPage }, // Skip results for pagination
      { $limit: perPage }, // Limit results per page
      {
        $lookup: {
          from: "postcats", // Correct collection name for PageCat
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },
    ]);
    const newBlogs = await Page.aggregate([
      { $match: { isActive: true } },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "postcats", // Correct collection name for PageCat
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
    const userId = await User.findOne({ username: user }).select(
      "username rule"
    );
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }
    console.log(req.user);
    if (!req.user.rule || req.user.rule === "user") {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    const total = await Page.countDocuments({
      $and: [{ isActive: true }, { user: userId._id }],
    });

    const posts = await Page.find({
      $and: [{ isActive: true }, { user: userId._id }],
    })
      .populate("categories")
      .sort({ createdAt: -1 }) // Use -1 for descending order
      .skip(perPage * (page - 1))
      .limit(perPage);
    const newBlogs = await Page.aggregate([
      { $match: { isActive: true } },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "postcats", // Correct collection name for PageCat
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
      userId,
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
