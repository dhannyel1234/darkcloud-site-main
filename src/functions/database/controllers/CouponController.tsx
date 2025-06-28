import Database from "../database";
import Coupon from "../schemas/CouponSchema";

async function create(data: any) {
    await Database.connect();
    const coupon = new Coupon(data);
    return await coupon.save();
};

async function find(filter: any) {
    await Database.connect();
    return await Coupon.findOne(filter);
};

async function findAll() {
    await Database.connect();
    return await Coupon.find({});
};

async function update(filter: any, updates: any) {
    await Database.connect();
    return await Coupon.findOneAndUpdate(filter, updates, { new: true });
};

async function remove(filter: any) {
    await Database.connect();
    return await Coupon.findOneAndDelete(filter);
};

const couponController = { create, find, findAll, update, remove };
export default couponController;