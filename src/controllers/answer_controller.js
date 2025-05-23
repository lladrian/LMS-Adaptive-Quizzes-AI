import asyncHandler from 'express-async-handler';
import moment from 'moment-timezone';
import dotenv from 'dotenv';
import Answer from '../models/answer.js';
import Exam from '../models/exam.js';

function storeCurrentDate(expirationAmount, expirationUnit) {
    // Get the current date and time in Asia/Manila timezone
    const currentDateTime = moment.tz("Asia/Manila");
    // Calculate the expiration date and time
    const expirationDateTime = currentDateTime.clone().add(expirationAmount, expirationUnit);

    // Format the current date and expiration date
    const formattedExpirationDateTime = expirationDateTime.format('YYYY-MM-DD HH:mm:ss');

    // Return both current and expiration date-time
    return formattedExpirationDateTime;
}

export const take_exam  = asyncHandler(async (req, res) => {
    const { exam_id, student_id } = req.params; // Get the meal ID from the request parameters    

    try {
        const existingAnswer = await Answer.findOne({
            exam: exam_id,
            student: student_id
        });

        if (existingAnswer) {
            return res.status(400).json({ message: 'You have already started this exam.' });
        }

        const newAnswer = new Answer({
            exam: exam_id,
            student: student_id,
            line_of_code: "",
            opened_at: storeCurrentDate(0, 'hours'),
            created_at: storeCurrentDate(0, 'hours'),
        });

        await newAnswer.save();

        return res.status(200).json({ message: 'New exam successfully created.' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create exam.' });
    }
});



export const get_all_answer_specific_exam = asyncHandler(async (req, res) => {  
    const { exam_id } = req.params; // Get the meal ID from the request parameters
  
    try {
        const exam = await Exam.findById(exam_id).populate('classroom');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found.' });
        }

        const answers = await Answer.find({ 
            exam: exam.id 
        });

        return res.status(200).json({ data: answers });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get all answers.' });
    }
});


export const get_specific_answer = asyncHandler(async (req, res) => {  
    const { answer_id } = req.params; // Get the meal ID from the request parameters
  
    try {
        const answer = await Answer.findById(answer_id).populate('exam').populate('student');

        if (!answer) {
            return res.status(404).json({ message: 'Answer not found.' });
        }

        return res.status(200).json({ data: answer });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get specific answer.' });
    }
});



export const create_answer = asyncHandler(async (req, res) => {
    const { line_of_code } = req.body;
    const { exam_id, student_id } = req.params; // Get the meal ID from the request parameters
    const now = moment.tz('Asia/Manila');

    try {
        if (!line_of_code) {
            return res.status(400).json({ message: "Please provide all fields (line_of_code)." });
        }
   
        const exam = await Exam.findById(exam_id);
       
        const answer = await Answer.findOne({
            exam: exam_id,
            student: student_id
        });

        if (answer) {
            const opened_exam = moment.tz(answer.opened_at, "YYYY-MM-DD HH:mm:ss", 'Asia/Manila');
            const diffMinutes = now.diff(opened_exam, 'minutes');

            //if (diffMinutes >= exam.submission_time) {
            if (diffMinutes >= 1) {
                return res.status(400).json({ message: 'Sorry! You can no longer submit your exam. The time is up.' });
            }
        } else {
            return res.status(400).json({ message: 'Not yet taking the exam.' });
        }
    
  
        answer.line_of_code = line_of_code;
        answer.submitted_at = storeCurrentDate(0, 'hours');

        await answer.save();

        return res.status(200).json({ message: 'New answer successfully created.' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create answer.' });
    }
});


