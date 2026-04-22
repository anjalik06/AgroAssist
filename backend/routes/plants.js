const express = require("express");
const router = express.Router();
const Plant = require("../models/Plant");
const authMiddleware = require("../middleware/authMiddleware");

function dateDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

/* ADD PLANT */

router.post("/add", authMiddleware, async (req,res)=>{

try{

const {name,sowingDate} = req.body;
const userId = req.user.id;

const plant = new Plant({
userId,
name,
sowingDate
});

await plant.save();

res.json({
success:true,
plant
});

}catch(err){

res.status(500).json({
  success: false,
  error:err.message
});

}

});


/* GET ALL PLANTS FOR CURRENT USER */

router.get("/all", authMiddleware, async(req,res)=>{

try{

const userId = req.user.id;
const plants = await Plant.find({userId}).sort({createdAt:-1});

res.json({
  success: true,
  plants: plants
});

}catch(err){

res.status(500).json({
  success: false,
  error:err.message
});

}

});

/* SEED DEMO CROPS FOR CURRENT USER */
router.post("/seed-demo", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { clearExisting = false } = req.body || {};

    if (clearExisting) {
      await Plant.deleteMany({ userId });
    }

    const demoPlants = [
      { name: "Tomato", sowingDate: dateDaysAgo(6) },
      { name: "Onion", sowingDate: dateDaysAgo(28) },
      { name: "Potato", sowingDate: dateDaysAgo(42) },
      { name: "Brinjal", sowingDate: dateDaysAgo(58) },
      { name: "Okra", sowingDate: dateDaysAgo(52) },
      { name: "Cabbage", sowingDate: dateDaysAgo(76) }
    ];

    const created = await Plant.insertMany(
      demoPlants.map((plant) => ({
        userId,
        name: plant.name,
        sowingDate: plant.sowingDate
      }))
    );

    res.json({
      success: true,
      message: "Demo crops added",
      count: created.length,
      plants: created
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


/* UPDATE PLANT (e.g. override stage) */

router.patch("/:id", authMiddleware, async (req, res) => {

  try {

    const userId = req.user.id;
    const { id } = req.params;
    const { overriddenStage } = req.body;

    const update = {};
    if (overriddenStage !== undefined) update.overriddenStage = overriddenStage;

    const plant = await Plant.findOneAndUpdate(
      { _id: id, userId },
      update,
      { new: true }
    );

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found"
      });
    }

    res.json({ success: true, plant });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});


/* DELETE PLANT */

router.delete("/:id", authMiddleware, async (req, res) => {

  try {

    const userId = req.user.id;
    const { id } = req.params;

    const plant = await Plant.findOneAndDelete({ _id: id, userId });

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found"
      });
    }

    res.json({
      success: true,
      message: "Plant deleted"
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

module.exports = router;
