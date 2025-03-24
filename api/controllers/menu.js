const mongoose = require("mongoose");
const Menu = require("../models/menu");
const { ForbiddenError } = require("@casl/ability");
const PostCat = require("../models/post_cat");
const config = require("../config/index");

exports.getLibaries = async (req, res) => {
  try {
    const onpages = Page.find().select("name slug tasks translations");
    const oncategories = Category.find().select("name slug tasks translations");
    const onpostcategories = PostCat.find().select("name slug tasks");
    const [pages, categories, postcat] = await Promise.all([
      onpages,
      oncategories,
      onpostcategories,
    ]);
    for (var i = 0; i < pages.length; i++) {
      pages[i].slug = "/" + pages[i].slug;
    }
    for (var i = 0; i < categories.length; i++) {
      categories[i].slug = "/cat/" + categories[i].slug;
    }
    for (var i = 0; i < postcat.length; i++) {
      postcat[i].slug = "/category/" + postcat[i].slug;
    }
    res.status(200).json({
      success: true,
      pages,
      categories,
      postcat,
    });
  } catch (err) {
    res.status(500).json({
      message: "Cant get products",
      error: err,
      success: false,
    });
  }
};


exports.createMenu = async (req, res) => {
    try {
      const { onList, onMain } = req.body;
  
      if (!onMain || !onMain.title || !onMain.position) {
        return res.status(400).json({
          success: false,
          message: "Title and position are required.",
        });
      }
  
      if (!Array.isArray(onList) || onList.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Menu items (onList) must be an array and cannot be empty.",
        });
      }
  
      // Validate each item in onList
      const validatedList = onList.map((item) => ({
        name: item.name || "",
        text: item.text || item.name, // Ensure text is same as name if not provided
        slug: item.slug || "",
        parent: item.parent || 0,
        id: item.id || Date.now(), // Ensure a valid ID
        _id: item._id || `${Date.now()}`, // Generate a unique _id if missing
        droppable: item.droppable ?? true, // Default to true
      }));
  
      const menu = new Menu({
        title: onMain.title,
        position: onMain.position,
        obj: validatedList,
      });
  
      await menu.save();
  
      res.status(200).json({
        success: true,
        menu,
      });
    } catch (err) {
      console.error("Error creating menu:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  };

exports.getMenu = async (req, res) => {
  const { perPage } = req.body || 50;
  const page = parseInt(req.body.page) || 1;
  try {
    const onTotal = Menu.countDocuments();
    const onMenus = Menu.find()
    .sort({ createdAt: "desc" })
    .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
    .limit(perPage);
    const [total, menus] = await Promise.all([onTotal, onMenus]);
    res.status(201).json({ success: true, menus, total });
  } catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      message: err,
    });
  }
};

exports.getOneMenu = async (req, res) => {
  try {
    // Find menu by ID, using lean() for performance
    const menu = await Menu.findById(req.params.id).lean();
    
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    // Format response structure
    const onMain = {
      title: menu.title || "",
      position: menu.position || 0,
      _id: menu._id || "",
    };

    const onList = Array.isArray(menu.obj) ? [...menu.obj] : []; // Ensure it's an array

    res.status(200).json({ success: true, onList, onMain, menu });
  } catch (err) {
    console.error("Error fetching menu:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};



exports.editMenu = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  try {
    const { onList, onMain } = req.body;

    // Validate onMain
    if (!onMain || !onMain._id) {
      return res.status(400).json({ success: false, message: "Invalid request: Missing onMain._id" });
    }

    // Find menu by ID
    const menu = await Menu.findById(onMain._id);
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    // Check permission
    ForbiddenError.from(ability).throwUnlessCan("update", menu);

    console.log("Updating Menu:", { onList, onMain });

    // Ensure onList is an array before mapping
    if (!Array.isArray(onList)) {
      return res.status(400).json({ success: false, message: "Invalid request: onList must be an array" });
    }

    // Update menu fields
    menu.obj = onList.map((item) => ({
      _id: item._id || "",
      name: (item.name || "").trim(),
      text: (item.text || "").trim(),
      slug: (item.slug || "").trim(),
      tasks: Array.isArray(item.tasks) ? item.tasks : [],
      id: item.id || 0,
      droppable: item.droppable ?? true, // Default true
      parent: item.parent ?? 0, // Default 0
    }));

    menu.position = onMain.position || "0";
    menu.title = (onMain.title || menu.title || "").trim();
    menu.updatedAt = new Date(); // Track last update time

    // Save updated menu
    await menu.save();

    res.status(200).json({
      success: true,
      message: "Menu updated successfully",
      menu,
    });
  } catch (err) {
    console.error("Edit Menu Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};


exports.deleteMenu = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  try {
    const menu = await Menu.findById({ _id: req.params.id });
    ForbiddenError.from(ability).throwUnlessCan("delete", menu);
    await menu.remove();
    res.status(201).send({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err,
    });
  }
};
