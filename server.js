const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb+srv://deecryptic:%23Oluwadamilare234@cluster1.pvjafzp.mongodb.net/?appName=Cluster1')
  .then(() => console.log("✅ MongoDB Connected! Data is Safe."))
  .catch(err => console.error("❌ DB Error:", err));

// --- SCHEMAS (DATA MODELS) ---
const UserSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true },
    password: String,
    role: String, 
    class_id: String
});

const WordSchema = new mongoose.Schema({
    word: String,
    definition: String,
    synonyms: String,
    antonyms: String,
    usage: String,
    etymology: String,
    class_id: String,
    source: String 
});

// NEW: Store Classes in DB
const ClassSchema = new mongoose.Schema({
    name: { type: String, unique: true }
});

// NEW: Store Results in DB
const ResultSchema = new mongoose.Schema({
    student: String,
    class_id: String,
    score: Number,
    total: Number,
    mode: String,
    date: String
});

// NEW: Store Live Test Status in DB (Syncs Teacher/Admin/Student)
const SessionSchema = new mongoose.Schema({
    class_id: { type: String, unique: true },
    active: Boolean,
    mode: String,
    globalTimer: Number,
    timerPerWord: Number
});

const User = mongoose.model('User', UserSchema);
const Word = mongoose.model('Word', WordSchema);
const ClassModel = mongoose.model('Class', ClassSchema);
const Result = mongoose.model('Result', ResultSchema);
const Session = mongoose.model('Session', SessionSchema);

// --- ROUTES ---

// 1. AUTH
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) res.json(user);
        else res.status(401).json({ message: "Invalid Credentials" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. USERS
app.get('/api/users', async (req, res) => res.json(await User.find()));
app.post('/api/users', async (req, res) => {
    try { await new User(req.body).save(); res.json({ msg: "Saved" }); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/users/:id/reset-password', async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { password: req.body.newPassword });
    res.json({ msg: "Updated" });
});
app.delete('/api/users/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
});

// 3. WORDS
app.get('/api/words/:classId', async (req, res) => res.json(await Word.find({ class_id: req.params.classId })));
app.post('/api/words', async (req, res) => {
    const w = await new Word(req.body).save();
    res.json(w);
});
app.put('/api/words/:id', async (req, res) => res.json(await Word.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/words/:id', async (req, res) => {
    await Word.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
});

// 4. CLASSES (NEW)
app.get('/api/classes', async (req, res) => res.json(await ClassModel.find()));
app.post('/api/classes', async (req, res) => {
    try { await new ClassModel({ name: req.body.name }).save(); res.json({ msg: "Saved" }); }
    catch(e) { res.status(500).json({ error: "Class exists" }); }
});
app.delete('/api/classes/:id', async (req, res) => {
    await ClassModel.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
});

// 5. RESULTS (NEW)
app.get('/api/results', async (req, res) => res.json(await Result.find()));
app.post('/api/results', async (req, res) => {
    await new Result(req.body).save();
    res.json({ msg: "Saved" });
});

// 6. SESSIONS (NEW - For Live Tests)
app.get('/api/session/:classId', async (req, res) => {
    const s = await Session.findOne({ class_id: req.params.classId });
    res.json(s || { active: false });
});
app.post('/api/session', async (req, res) => {
    const { class_id, active, mode, globalTimer, timerPerWord } = req.body;
    await Session.findOneAndUpdate(
        { class_id }, 
        { active, mode, globalTimer, timerPerWord },
        { upsert: true, new: true }
    );
    res.json({ msg: "Session Updated" });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));