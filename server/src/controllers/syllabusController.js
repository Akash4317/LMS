import Course from '../models/course.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import Syllabus from '../models/syllabus.js';

// Get all syllabus for a course
export const getCourseSyllabus = asyncHandler(async (req, res) => {
    const syllabus = await Syllabus.find({ courseId: req.params.courseId }).populate('topics.lectures').sort({ order: 1 });

    res.json({
        success: true,
        data: syllabus,
    });
})

// Get single syllabus
export const getSyllabusById = asyncHandler(async (req, res) => {
    const syllabus = await Syllabus.find(req.params.id).populate('courseId', 'title description')
        .populate('topics.lectures')
        .populate('createdBy', 'name email');

    if (!syllabus) {
        throw new AppError('no syllabus found', 404);
    }
    res.json({
        success: true,
        data: syllabus
    })
})

// Create syllabus
export const createSyllabus = asyncHandler(async (req, res) => {
    const { title, description, order, topics } = req.body;

    const course = await Course.findById(req.params.courseId);

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    const syllabus = await Syllabus.create({
        courseId: req.params.courseId,
        title,
        description,
        order,
        topics: topics || [],
        createdBy: req.user._id,
    });

    // add syllabus to course 
    course.syllabus.push(syllabus._id);
    await course.save();

    await syllabus.populate('topics.lectures createdBy');

    res.status(201).json({
        success: true,
        message: 'Syllabus created successfully',
        data: syllabus,
    });
})

// update syllabus
export const updateSyllabus = asyncHandler(async (req, res) => {

    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus) {
        throw new AppError('syllabus not found', 404);
    }

    const { title, description, order, topics, isPublished } = req.body;

    if (title) syllabus.title = title;
    if (description !== undefined) syllabus.description = description;
    if (order !== undefined) syllabus.order = order;
    if (topics) syllabus.topics = topics;
    if (isPublished !== undefined) syllabus.isPublished = isPublished;

    await syllabus.save();
    await syllabus.populate('topics.lectures');

    res.json({
        success: true,
        message: 'Syllabus updated successfully',
        data: syllabus,
    });
})

// Delete syllabus
export const deleteSyllabus = asyncHandler(async (req, res) => {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
        throw new AppError('Syllabus not found', 404);
    }

    // Remove from course
    await Course.findByIdAndUpdate(syllabus.courseId, {
        $pull: { syllabus: syllabus._id },
    });

    await syllabus.deleteOne();

    res.json({
        success: true,
        message: 'Syllabus deleted successfully',
    });
})

// Add topic to syllabus
export const addTopic = asyncHandler(async (req, res) => {
    const { title, description, order, estimatedDuration, resources } = req.body;

    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
        throw new AppError('Syllabus not found', 404);
    }

    syllabus.topics.push({
        title,
        description,
        order: order || syllabus.topics.length,
        lectures: [],
        resources,
        estimatedDuration,
    });

    await syllabus.save();

    res.status(201).json({
        success: true,
        message: 'Topic added successfully',
        data: syllabus,
    });
})

// Update topic
export const updateTopic = asyncHandler(async (req, res) => {
    const { topicId } = req.params;

    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
        throw new AppError('Syllabus not found', 404);
    }

    const topic = syllabus.topics.id(topicId);

    if (!topic) {
        throw new AppError('Topic not found', 404);
    }

    const { title, description, order, estimatedDuration, resources } = req.body;

    if (title) topic.title = title;
    if (description !== undefined) topic.description = description;
    if (order !== undefined) topic.order = order;
    if (estimatedDuration !== undefined) topic.estimatedDuration = estimatedDuration;
    if (resources) topic.resources = resources;

    await syllabus.save();

    res.json({
        success: true,
        message: 'Topic updated successfully',
        data: syllabus,
    });
})

// Delete topic
export const deleteTopic = asyncHandler(async (req, res) => {
    const { topicId } = req.params;

    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
        throw new AppError('Syllabus not found', 404);
    }

    syllabus.topics = syllabus.topics.filter(
        (topic) => topic._id.toString() !== topicId
    );

    await syllabus.save();

    res.json({
        success: true,
        message: 'Topic deleted successfully',
    });
})