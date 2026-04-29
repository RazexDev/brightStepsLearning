import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, RotateCcw, ChevronRight } from 'lucide-react';
import './EmotionExplorer.css';

// ─────────────────────────────────────────────────────────────────
// LEVEL CONFIG
// ─────────────────────────────────────────────────────────────────
const LEVEL_CONFIG = [
  { level: 1, label: 'Basic Feelings',    emoji: '😊', pairs: 5,  description: 'Clear, everyday emotions' },
  { level: 2, label: 'Complex Feelings',  emoji: '🤔', pairs: 7,  description: 'Nuanced personal feelings' },
  { level: 3, label: 'Social Scenarios',  emoji: '🫂', pairs: 9,  description: 'Feelings about other people' },
  { level: 4, label: 'Tricky Moments',    emoji: '🧩', pairs: 11, description: 'Mixed and challenging emotions' },
];

// ─────────────────────────────────────────────────────────────────
// EMOTION OPTION → EMOJI MAP  (used on the answer buttons)
// ─────────────────────────────────────────────────────────────────
const EMOTION_EMOJI = {
  Happy:        '😄', Sad:          '😢', Angry:        '😡',
  Surprised:    '😲', Scared:       '😨', Frustrated:   '😤',
  Proud:        '🦸', 'Left Out':   '🥺', Impatient:    '😒',
  Embarrassed:  '😳', Confused:     '😕', Calm:         '😌',
  Empathetic:   '🫂', Hopeful:      '🌟', Guilty:       '🫣',
  Jealous:      '😾', Grateful:     '🥰', Relieved:     '😮‍💨',
  Nervous:      '😬', Forgiving:    '🤝', Overwhelmed:  '😵‍💫',
  Disappointed: '😞', Annoyed:      '😤', Determined:   '💪',
  Honest:       '😇', Spooked:      '👻', Relaxed:      '😎',
  Confident:    '🦁', Bored:        '😑', Excited:      '🤩',
  Shy:          '😶', Cheerful:     '🎉', Lonely:       '🌧️',
  Cozy:         '🤗', Curious:      '🔍', Melancholy:   '😔',
  Courageous:   '🦅', Tender:       '💛', Playful:      '🎈',
  Grumpy:       '😠', Delighted:    '✨', Joyful:       '🌈',
  Cautious:     '🐢', Content:      '☁️', Awe:          '🌠',
};

// ─────────────────────────────────────────────────────────────────
// SCENARIO DATABASE  – 80 unique scenarios across 4 levels
// ─────────────────────────────────────────────────────────────────
const ALL_SCENARIOS = [

  // ══════ LEVEL 1 — Basic Feelings (20 scenarios) ══════
  { id:  1, level: 1, category: 'Joy',     text: "You just got your favourite ice cream!",                             correct: "Happy",       emoji: "😄", tip: "Ice cream = happiness! 🍦",                                 options: ["Happy","Sad","Angry"] },
  { id:  2, level: 1, category: 'Sadness', text: "Your balloon floated away into the sky and you can't reach it.",    correct: "Sad",         emoji: "😢", tip: "Losing something we love feels sad.",                       options: ["Happy","Sad","Surprised"] },
  { id:  3, level: 1, category: 'Anger',   text: "Someone took your toy without asking and won't give it back.",      correct: "Angry",       emoji: "😡", tip: "When something feels unfair, we often feel angry.",         options: ["Calm","Sad","Angry"] },
  { id:  4, level: 1, category: 'Surprise',text: "Mum hid a big gift behind her back and jumped out — surprise!",    correct: "Surprised",   emoji: "😲", tip: "Unexpected things make us feel surprised!",                 options: ["Angry","Surprised","Sad"] },
  { id:  5, level: 1, category: 'Fear',    text: "A huge clap of thunder shakes the house at night.",                 correct: "Scared",      emoji: "😨", tip: "Loud, sudden noises can make us feel scared.",              options: ["Happy","Scared","Angry"] },
  { id:  6, level: 1, category: 'Joy',     text: "You're playing your favourite video game with your best friend.",   correct: "Happy",       emoji: "😄", tip: "Doing fun things with friends feels great!",                options: ["Happy","Scared","Sad"] },
  { id:  7, level: 1, category: 'Surprise',text: "Your friend shows up at your door with a birthday cake — today!",  correct: "Surprised",   emoji: "😲", tip: "Nice surprises feel wonderful!",                            options: ["Angry","Surprised","Calm"] },
  { id:  8, level: 1, category: 'Sadness', text: "Your pet fish stopped moving and won't swim anymore.",              correct: "Sad",         emoji: "😢", tip: "When we lose someone we care about, we feel sad.",          options: ["Happy","Sad","Angry"] },
  { id:  9, level: 1, category: 'Joy',     text: "It's the first day of summer holidays — no school!",               correct: "Excited",     emoji: "🤩", tip: "Looking forward to something fun makes us excited!",        options: ["Excited","Scared","Sad"] },
  { id: 10, level: 1, category: 'Fear',    text: "The lights go out and the whole house is completely dark.",         correct: "Scared",      emoji: "😨", tip: "Not being able to see can feel scary.",                     options: ["Happy","Scared","Bored"] },
  { id: 11, level: 1, category: 'Joy',     text: "You found a £5 coin on the pavement — it's yours to keep!",        correct: "Excited",     emoji: "🤩", tip: "Unexpected good luck makes us feel excited!",               options: ["Excited","Sad","Angry"] },
  { id: 12, level: 1, category: 'Anger',   text: "Your sibling keeps pressing your buttons and won't stop.",         correct: "Angry",       emoji: "😡", tip: "When someone keeps bothering us it feels frustrating.",     options: ["Happy","Calm","Angry"] },
  { id: 13, level: 1, category: 'Calm',    text: "You're lying on soft grass, watching fluffy clouds go by.",        correct: "Calm",        emoji: "😌", tip: "Peaceful moments in nature help us feel calm.",             options: ["Angry","Scared","Calm"] },
  { id: 14, level: 1, category: 'Joy',     text: "Your favourite song comes on the radio and you know every word.",  correct: "Cheerful",    emoji: "🎉", tip: "Music we love makes us feel cheerful!",                     options: ["Cheerful","Sad","Scared"] },
  { id: 15, level: 1, category: 'Sadness', text: "You missed the bus and now you'll be late for your school trip.",  correct: "Sad",         emoji: "😢", tip: "Missing out on something we looked forward to feels sad.",  options: ["Happy","Sad","Proud"] },
  { id: 16, level: 1, category: 'Fear',    text: "A big dog runs towards you barking very loudly.",                  correct: "Scared",      emoji: "😨", tip: "Feeling threatened makes us scared.",                       options: ["Scared","Happy","Calm"] },
  { id: 17, level: 1, category: 'Joy',     text: "Your teacher puts a gold star on your drawing in front of class.", correct: "Happy",       emoji: "😄", tip: "Being recognised for our efforts feels wonderful!",         options: ["Happy","Confused","Sad"] },
  { id: 18, level: 1, category: 'Surprise',text: "You open your lunchbox and find your favourite treat inside.",     correct: "Surprised",   emoji: "😲", tip: "Small surprises can make the whole day better!",            options: ["Surprised","Sad","Angry"] },
  { id: 19, level: 1, category: 'Sadness', text: "You can't find your favourite toy anywhere in the whole house.",   correct: "Sad",         emoji: "😢", tip: "Losing something special makes us feel sad.",               options: ["Happy","Sad","Angry"] },
  { id: 20, level: 1, category: 'Joy',     text: "You scored the winning goal for your team!",                       correct: "Joyful",      emoji: "🌈", tip: "Winning for your team feels absolutely joyful!",            options: ["Joyful","Sad","Scared"] },

  // ══════ LEVEL 2 — Complex Feelings (20 scenarios) ══════
  { id: 21, level: 2, category: 'Frustration', text: "You try to tie your shoelaces but they keep coming undone.",         correct: "Frustrated",  emoji: "😤", tip: "When we keep trying but can't get it right, we feel frustrated.", options: ["Happy","Frustrated","Calm"] },
  { id: 22, level: 2, category: 'Pride',       text: "You finally figured out a really hard puzzle all by yourself!",      correct: "Proud",       emoji: "🦸", tip: "Doing something hard on your own makes us proud.",              options: ["Proud","Sad","Scared"] },
  { id: 23, level: 2, category: 'Loneliness',  text: "Your friends are playing a game but didn't ask you to join.",        correct: "Left Out",    emoji: "🥺", tip: "Being excluded can make us feel left out.",                     options: ["Happy","Left Out","Proud"] },
  { id: 24, level: 2, category: 'Impatience',  text: "You're waiting at the dentist and it's taking forever.",             correct: "Impatient",   emoji: "😒", tip: "Long waits can make us feel impatient.",                        options: ["Impatient","Happy","Calm"] },
  { id: 25, level: 2, category: 'Embarrassment',text:"You slipped on a wet floor right in front of your whole class.",     correct: "Embarrassed", emoji: "😳", tip: "Accidents in public often make us feel embarrassed.",           options: ["Proud","Embarrassed","Happy"] },
  { id: 26, level: 2, category: 'Confusion',   text: "The teacher explained something really fast and you got lost.",       correct: "Confused",    emoji: "😕", tip: "When things move too fast, we feel confused.",                  options: ["Angry","Confused","Calm"] },
  { id: 27, level: 2, category: 'Calm',        text: "You're wrapped in a blanket with hot chocolate on a rainy day.",     correct: "Cozy",        emoji: "🤗", tip: "Warmth and comfort make us feel cozy!",                        options: ["Angry","Scared","Cozy"] },
  { id: 28, level: 2, category: 'Pride',       text: "You remembered to water your plant every day and it grew flowers!",  correct: "Proud",       emoji: "🦸", tip: "Looking after something patiently makes us proud.",             options: ["Proud","Confused","Sad"] },
  { id: 29, level: 2, category: 'Curiosity',   text: "You find a mysterious locked box with strange markings on it.",      correct: "Curious",     emoji: "🔍", tip: "Mysterious things make us curious!",                           options: ["Scared","Curious","Angry"] },
  { id: 30, level: 2, category: 'Melancholy',  text: "Looking at old photos from your last family holiday.",               correct: "Melancholy",  emoji: "😔", tip: "Remembering happy times that are gone can feel bittersweet.",  options: ["Melancholy","Angry","Excited"] },
  { id: 31, level: 2, category: 'Shyness',     text: "You have to introduce yourself to a whole new class of children.",   correct: "Shy",         emoji: "😶", tip: "Meeting lots of new people at once can feel shy-making.",      options: ["Shy","Happy","Frustrated"] },
  { id: 32, level: 2, category: 'Frustration', text: "Your drawing smudged at the very last second and now it's ruined.",  correct: "Frustrated",  emoji: "😤", tip: "Effort getting ruined at the last moment is so frustrating!",  options: ["Frustrated","Proud","Calm"] },
  { id: 33, level: 2, category: 'Excitement',  text: "You get a letter saying you've been chosen for the school play!",   correct: "Excited",     emoji: "🤩", tip: "Getting chosen for something special makes us excited!",        options: ["Excited","Lonely","Scared"] },
  { id: 34, level: 2, category: 'Loneliness',  text: "All your friends went to a birthday party and you weren't invited.", correct: "Lonely",      emoji: "🌧️", tip: "Being left out of things can feel very lonely.",               options: ["Lonely","Proud","Happy"] },
  { id: 35, level: 2, category: 'Curiosity',   text: "You discover a secret door behind a bookcase in your house.",        correct: "Curious",     emoji: "🔍", tip: "Secret things spark our curiosity!",                           options: ["Scared","Curious","Bored"] },
  { id: 36, level: 2, category: 'Pride',       text: "You helped your little sister learn to read her first book.",        correct: "Proud",       emoji: "🦸", tip: "Helping others grow makes us proud.",                           options: ["Proud","Sad","Frustrated"] },
  { id: 37, level: 2, category: 'Confusion',   text: "The instructions had ten steps but you can only remember three.",    correct: "Confused",    emoji: "😕", tip: "Too many steps at once leaves us feeling confused.",           options: ["Confused","Happy","Proud"] },
  { id: 38, level: 2, category: 'Calm',        text: "You finish your homework early and have a whole free afternoon.",    correct: "Content",     emoji: "☁️", tip: "Finishing our work and relaxing feels content.",               options: ["Content","Angry","Scared"] },
  { id: 39, level: 2, category: 'Shyness',     text: "Someone compliments your shirt and everyone turns to look at you.",  correct: "Embarrassed", emoji: "😳", tip: "Unexpected attention can make us feel embarrassed.",           options: ["Embarrassed","Proud","Excited"] },
  { id: 40, level: 2, category: 'Excitement',  text: "Tomorrow is the school trip to the adventure park!",                correct: "Excited",     emoji: "🤩", tip: "Anticipating fun makes us excited!",                           options: ["Excited","Sad","Confused"] },

  // ══════ LEVEL 3 — Social Scenarios (20 scenarios) ══════
  { id: 41, level: 3, category: 'Empathy',     text: "You see your best friend crying by themselves in the playground.",   correct: "Empathetic",  emoji: "🫂", tip: "Feeling for someone else's pain is empathy.",                  options: ["Angry","Empathetic","Happy"] },
  { id: 42, level: 3, category: 'Hope',        text: "You got a question wrong, but the teacher says tomorrow is a new chance.", correct: "Hopeful",   emoji: "🌟", tip: "Believing things can get better is called hope.",             options: ["Hopeful","Scared","Angry"] },
  { id: 43, level: 3, category: 'Guilt',       text: "You broke your brother's favourite toy and quietly hid the pieces.", correct: "Guilty",      emoji: "🫣", tip: "Doing something wrong and hiding it makes us feel guilty.",   options: ["Proud","Guilty","Relieved"] },
  { id: 44, level: 3, category: 'Jealousy',    text: "Your sister got the exact toy you asked for — but it was her birthday.", correct: "Jealous",  emoji: "😾", tip: "Wanting what someone else has is called jealousy.",           options: ["Jealous","Relieved","Guilty"] },
  { id: 45, level: 3, category: 'Gratitude',   text: "Your teacher stayed after class to help you finish your project.",   correct: "Grateful",    emoji: "🥰", tip: "When someone goes out of their way for us, we feel grateful.", options: ["Angry","Jealous","Grateful"] },
  { id: 46, level: 3, category: 'Relief',      text: "You thought you'd lost your bus pass but found it in your pocket!",  correct: "Relieved",    emoji: "😮‍💨", tip: "Finding something after thinking it was gone = relief!",    options: ["Relieved","Sad","Jealous"] },
  { id: 47, level: 3, category: 'Empathy',     text: "A new classmate is sitting alone at lunch looking nervous.",         correct: "Empathetic",  emoji: "🫂", tip: "Noticing others' feelings and caring = empathy.",             options: ["Empathetic","Happy","Proud"] },
  { id: 48, level: 3, category: 'Gratitude',   text: "Your friend shared their last biscuit with you on the field trip.",  correct: "Grateful",    emoji: "🥰", tip: "Sharing is kind, and we feel grateful for kind acts.",         options: ["Guilty","Grateful","Angry"] },
  { id: 49, level: 3, category: 'Guilt',       text: "You laughed at someone's drawing, then felt bad about it straight away.", correct: "Guilty",  emoji: "🫣", tip: "Hurting someone's feelings by accident makes us feel guilty.",options: ["Proud","Guilty","Happy"] },
  { id: 50, level: 3, category: 'Courage',     text: "You stood up for a friend who was being bullied, even though it was scary.", correct: "Courageous", emoji: "🦅", tip: "Being brave for others is true courage!",               options: ["Courageous","Guilty","Confused"] },
  { id: 51, level: 3, category: 'Hope',        text: "You practised your times tables all week. The test is tomorrow.",    correct: "Hopeful",     emoji: "🌟", tip: "Hard work makes us hopeful for a good result!",             options: ["Hopeful","Angry","Left Out"] },
  { id: 52, level: 3, category: 'Jealousy',    text: "Your friend always gets picked first for teams but you never do.",   correct: "Jealous",     emoji: "😾", tip: "Not being chosen when others are can feel jealous.",          options: ["Jealous","Happy","Relieved"] },
  { id: 53, level: 3, category: 'Gratitude',   text: "A stranger held the door open for you when your arms were full.",    correct: "Grateful",    emoji: "🥰", tip: "Small acts of kindness make us feel grateful.",              options: ["Grateful","Angry","Sad"] },
  { id: 54, level: 3, category: 'Empathy',     text: "Your mum looks really tired after working all day. You want to help.", correct: "Empathetic", emoji: "🫂", tip: "Noticing when someone needs help shows great empathy.",      options: ["Empathetic","Jealous","Proud"] },
  { id: 55, level: 3, category: 'Relief',      text: "You were worried the dentist would hurt, but it didn't hurt at all!", correct: "Relieved",   emoji: "😮‍💨", tip: "When something scary turns out fine, we feel relieved!",   options: ["Relieved","Scared","Angry"] },
  { id: 56, level: 3, category: 'Courage',     text: "You tried something new at school even though you were nervous.",    correct: "Courageous",  emoji: "🦅", tip: "Doing something scary anyway is called courage!",            options: ["Courageous","Guilty","Lonely"] },
  { id: 57, level: 3, category: 'Guilt',       text: "You promised to feed the dog but forgot and now it's very hungry.",  correct: "Guilty",      emoji: "🫣", tip: "Breaking a promise makes us feel guilty.",                    options: ["Guilty","Happy","Relieved"] },
  { id: 58, level: 3, category: 'Hope',        text: "Your team is losing by one goal with two minutes left.",             correct: "Hopeful",     emoji: "🌟", tip: "Believing you can still win is hope!",                        options: ["Hopeful","Sad","Angry"] },
  { id: 59, level: 3, category: 'Gratitude',   text: "Someone remembered your favourite colour when wrapping your present.", correct: "Grateful",  emoji: "🥰", tip: "Being thought about in detail makes us feel grateful.",       options: ["Grateful","Jealous","Sad"] },
  { id: 60, level: 3, category: 'Empathy',     text: "You notice your teacher seems upset today and ask if they're okay.",  correct: "Empathetic", emoji: "🫂", tip: "Checking on others shows beautiful empathy.",                options: ["Empathetic","Proud","Angry"] },

  // ══════ LEVEL 4 — Tricky Moments (20 scenarios) ══════
  { id: 61, level: 4, category: 'Mixed',       text: "You're about to go on a huge roller coaster for the very first time.", correct: "Nervous",    emoji: "😬", tip: "Nervous is that mix of scared and excited!",                  options: ["Nervous","Angry","Sad"] },
  { id: 62, level: 4, category: 'Forgiveness', text: "Your friend broke your craft by accident and immediately said sorry.", correct: "Forgiving",  emoji: "🤝", tip: "Accepting a sincere apology is called forgiving.",           options: ["Forgiving","Jealous","Proud"] },
  { id: 63, level: 4, category: 'Sensory',     text: "The cafeteria is so loud and crowded that you can't think straight.", correct: "Overwhelmed", emoji: "😵‍💫", tip: "Too much at once makes us feel overwhelmed.",             options: ["Happy","Overwhelmed","Confident"] },
  { id: 64, level: 4, category: 'Disappointment', text: "You saved up for weeks for a trip, but it got cancelled because of rain.", correct: "Disappointed", emoji: "😞", tip: "When something we really wanted doesn't happen, we feel disappointed.", options: ["Disappointed","Proud","Scared"] },
  { id: 65, level: 4, category: 'Annoyance',   text: "Your sibling keeps humming the same tune over and over for an hour.", correct: "Annoyed",     emoji: "😤", tip: "Repeated small things can make us feel annoyed.",             options: ["Annoyed","Empathetic","Grateful"] },
  { id: 66, level: 4, category: 'Determination',text:"You've been practising a tricky piano piece all week and won't stop.", correct: "Determined",  emoji: "💪", tip: "Not giving up shows determination!",                         options: ["Determined","Guilty","Relaxed"] },
  { id: 67, level: 4, category: 'Honesty',     text: "Someone drops their wallet and you run to give it back to them.",     correct: "Honest",      emoji: "😇", tip: "Doing the right thing even when no-one is watching = honest.", options: ["Guilty","Honest","Jealous"] },
  { id: 68, level: 4, category: 'Spooky',      text: "You hear a strange scratching sound at your window in the night.",    correct: "Spooked",     emoji: "👻", tip: "Mysterious sounds at night make us feel spooked!",           options: ["Spooked","Bored","Confident"] },
  { id: 69, level: 4, category: 'Calm',        text: "You finished all your chores early and have a free afternoon.",       correct: "Relaxed",     emoji: "😎", tip: "Finishing responsibilities and resting = relaxed.",           options: ["Relaxed","Overwhelmed","Annoyed"] },
  { id: 70, level: 4, category: 'Confidence',  text: "You studied really hard and feel completely ready for your test.",    correct: "Confident",   emoji: "🦁", tip: "Preparation builds confidence!",                             options: ["Confident","Guilty","Bored"] },
  { id: 71, level: 4, category: 'Sensory',     text: "There are too many people talking at once and it feels very loud.",   correct: "Overwhelmed", emoji: "😵‍💫", tip: "Sensory overload can make anyone feel overwhelmed.",      options: ["Overwhelmed","Happy","Proud"] },
  { id: 72, level: 4, category: 'Forgiveness', text: "Your older sibling teased you last week but now they're being kind.", correct: "Forgiving",  emoji: "🤝", tip: "Letting go of past hurts is called forgiving.",               options: ["Forgiving","Annoyed","Jealous"] },
  { id: 73, level: 4, category: 'Mixed',       text: "You're excited for the talent show but also really worried you'll forget your lines.", correct: "Nervous", emoji: "😬", tip: "Big events often bring nervous + excited together!",  options: ["Nervous","Sad","Relieved"] },
  { id: 74, level: 4, category: 'Courage',     text: "You chose to tell the teacher the truth even though you were scared.", correct: "Courageous", emoji: "🦅", tip: "Being truthful when it's hard takes real courage!",          options: ["Courageous","Guilty","Embarrassed"] },
  { id: 75, level: 4, category: 'Disappointment', text: "You practised hard for the team but didn't make the final cut.",  correct: "Disappointed", emoji: "😞", tip: "Trying your best but not making it still feels disappointing.", options: ["Disappointed","Confident","Relieved"] },
  { id: 76, level: 4, category: 'Determination',text:"Every time the wind blows your sandcastle down, you build it taller.", correct: "Determined",  emoji: "💪", tip: "Starting over with energy shows determination!",             options: ["Determined","Sad","Lonely"] },
  { id: 77, level: 4, category: 'Awe',         text: "You see a shooting star streak across the entire night sky.",        correct: "Awe",         emoji: "🌠", tip: "Witnessing something breathtaking fills us with awe.",        options: ["Awe","Angry","Bored"] },
  { id: 78, level: 4, category: 'Confidence',  text: "You give a speech in front of everyone and don't stumble once.",     correct: "Confident",   emoji: "🦁", tip: "Doing something difficult smoothly builds confidence!",       options: ["Confident","Left Out","Nervous"] },
  { id: 79, level: 4, category: 'Playfulness', text: "You and your best friend make up a totally silly secret handshake.", correct: "Playful",     emoji: "🎈", tip: "Being silly and creative with friends = playful!",           options: ["Playful","Sad","Overwhelmed"] },
  { id: 80, level: 4, category: 'Tenderness',  text: "You help a tiny beetle that's stuck on its back get back up again.", correct: "Tender",      emoji: "💛", tip: "Caring for small, helpless things shows tenderness.",         options: ["Tender","Annoyed","Jealous"] },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function getStars(moves, pairs) {
  if (moves <= pairs + 1) return 3;
  if (moves <= pairs + 3) return 2;
  return 1;
}

// Background decoration data
const BG_DECOS = [
  { emoji: '😊', sz: '5rem',  top: '8%',  left: '3%',  dur: '14s', delay: '0s' },
  { emoji: '💛', sz: '4rem',  top: '75%', left: '6%',  dur: '12s', delay: '2s' },
  { emoji: '🌟', sz: '4.5rem',top: '12%', left: '85%', dur: '16s', delay: '1s' },
  { emoji: '🫂', sz: '5rem',  top: '65%', left: '88%', dur: '13s', delay: '3s' },
  { emoji: '🎈', sz: '3.5rem',top: '40%', left: '92%', dur: '18s', delay: '0.5s' },
  { emoji: '🌈', sz: '4rem',  top: '85%', left: '50%', dur: '15s', delay: '1.5s' },
  { emoji: '✨', sz: '3rem',  top: '20%', left: '50%', dur: '11s', delay: '2.5s' },
];

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function EmotionExplorer() {
  const [currentLevel,    setCurrentLevel]    = useState(1);
  const [highestUnlocked, setHighestUnlocked] = useState(1);
  const [scenarios,       setScenarios]       = useState([]);
  const [currentIndex,    setCurrentIndex]    = useState(0);

  // Stats
  const [moves,         setMoves]         = useState(0);
  const [correctCount,  setCorrectCount]  = useState(0);
  const [gameWon,       setGameWon]       = useState(false);
  const [startTime,     setStartTime]     = useState(null);
  const [elapsedSec,    setElapsedSec]    = useState(0);
  const timerRef = useRef(null);

  // Feedback state: null | { type: 'correct'|'incorrect', selected: string }
  const [feedback, setFeedback] = useState(null);
  const [earnedStars, setEarnedStars] = useState(0);

  // Parent modal
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentPassword,  setParentPassword]  = useState('');
  const [passwordError,   setPasswordError]   = useState('');
  const [isVerifying,     setIsVerifying]     = useState(false);

  const playSound = (type) => {
    try {
      const audio = new Audio(type === 'win' ? '/sounds/hooray.mp3' : '/sounds/pop.mp3');
      audio.volume = 0.4;
      // 👇 We add .catch() directly to the play() promise to stop the crash!
      audio.play().catch((err) => {
        console.warn("Sound skipped: Missing MP3 file or browser blocked audio.");
      });
    } catch (err) { 
      console.warn("Audio not supported.");
    }
  };

  /* ── Load Progression ── */
  useEffect(() => {
    const saved = localStorage.getItem('brightsteps_emotions_unlocked');
    if (saved) setHighestUnlocked(parseInt(saved));
  }, []);

  /* ── Timer ── */
  useEffect(() => {
    if (gameWon || !startTime) return;
    timerRef.current = setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startTime) / 1000)),
      1000
    );
    return () => clearInterval(timerRef.current);
  }, [startTime, gameWon]);

  /* ── Init on level change ── */
  useEffect(() => { initializeGame(currentLevel); }, [currentLevel]);

  const initializeGame = (levelNum) => {
    clearInterval(timerRef.current);
    const config    = LEVEL_CONFIG.find(c => c.level === levelNum);
    const available = ALL_SCENARIOS.filter(s => s.level === levelNum);

    // pick `config.pairs` scenarios at random
    const picked = [...available]
      .sort(() => Math.random() - 0.5)
      .slice(0, config.pairs)
      .map(s => ({ ...s, options: [...s.options].sort(() => Math.random() - 0.5) }));

    setScenarios(picked);
    setCurrentIndex(0);
    setMoves(0);
    setCorrectCount(0);
    setGameWon(false);
    setFeedback(null);
    setEarnedStars(0);
    setElapsedSec(0);
    setStartTime(Date.now());
  };

  /* ── Answer Logic ── */
  const handleOptionClick = (selected) => {
    if (feedback !== null) return;

    const newMoves = moves + 1;
    setMoves(newMoves);

    const scenario  = scenarios[currentIndex];
    const isCorrect = selected === scenario.correct;

    setFeedback({ type: isCorrect ? 'correct' : 'incorrect', selected });

    if (isCorrect) {
      playSound('pop');
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);

      setTimeout(() => {
        setFeedback(null);
        const nextIdx = currentIndex + 1;
        if (nextIdx < scenarios.length) {
          setCurrentIndex(nextIdx);
        } else {
          handleWin(newMoves);
        }
      }, 1800);
    } else {
      setTimeout(() => setFeedback(null), 900);
    }
  };

  const handleWin = (finalMoves) => {
    clearInterval(timerRef.current);
    setGameWon(true);
    playSound('win');
    window.dispatchEvent(new CustomEvent('sparky-cheer', { detail: { gameName: 'Emotion Explorer' } }));

    const config    = LEVEL_CONFIG.find(c => c.level === currentLevel);
    const stars     = getStars(finalMoves, config.pairs);
    setEarnedStars(stars);

    if (currentLevel === highestUnlocked && currentLevel < LEVEL_CONFIG.length) {
      const next = currentLevel + 1;
      setHighestUnlocked(next);
      localStorage.setItem('brightsteps_emotions_unlocked', next.toString());
    }
    saveProgress(stars, finalMoves);
  };

  const saveProgress = async (stars, totalMoves) => {
    const userString = localStorage.getItem('brightsteps_user');
    let childId = 'guest_player';
    if (userString) {
      try {
        const user = JSON.parse(userString);
        childId = user._id || user.user?.id || 'guest_player';
      } catch { /* parse error */ }
    }
    const payload = {
      childId, gameName: 'EmotionExplorer', levelPlayed: currentLevel,
      score: 100, stars, completionTime: elapsedSec,
      totalMoves, date: new Date().toISOString(),
    };
    try {
      await fetch('/api/progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch { /* API error */ }
  };

  const verifyParentPassword = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const user = JSON.parse(localStorage.getItem('brightsteps_user'));
      const userId = user._id || user.id || user.user?._id || user.user?.id;
      const res  = await fetch('/api/auth/verify-pin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin: parentPassword }),
      });
      if (res.ok) {
        setHighestUnlocked(LEVEL_CONFIG.length);
        localStorage.setItem('brightsteps_emotions_unlocked', LEVEL_CONFIG.length.toString());
        setShowParentModal(false);
      } else { setPasswordError('Incorrect PIN. Try again! 🔒'); }
    } catch { setPasswordError('Server error. Please try again.'); }
    finally   { setIsVerifying(false); }
  };

  const config          = LEVEL_CONFIG[currentLevel - 1];
  const currentScenario = scenarios[currentIndex];

  return (
    <div className="ee-root">

      {/* ── Background emoji decos ── */}
      {BG_DECOS.map((d, i) => (
        <span
          key={i}
          className="ee-bg-deco"
          style={{ '--sz': d.sz, '--top': d.top, '--left': d.left, '--dur': d.dur, '--delay': d.delay }}
        >
          {d.emoji}
        </span>
      ))}

      {/* ── Parent Modal ── */}
      {showParentModal && (
        <div className="ee-modal-overlay">
          <div className="ee-modal">
            <div className="ee-modal-icon">🔒</div>
            <h3>Parent Access</h3>
            <p>Enter your 4-digit PIN to unlock all levels.</p>
            <form onSubmit={verifyParentPassword}>
              <input
                type="password"
                placeholder="Enter PIN…"
                value={parentPassword}
                onChange={e => setParentPassword(e.target.value)}
                required
                autoFocus
              />
              {passwordError && <div className="ee-modal-error">⚠️ {passwordError}</div>}
              <div className="ee-modal-actions">
                <button type="button" className="ee-modal-cancel"
                  onClick={() => { setShowParentModal(false); setPasswordError(''); }}>
                  Cancel
                </button>
                <button type="submit" className="ee-modal-submit" disabled={isVerifying}>
                  {isVerifying ? '⏳ Checking…' : '🔓 Unlock All'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="ee-header">
        <div className="ee-header-top">
          <Link to="/games" className="ee-back-link">
            <ArrowLeft size={15} /> Games Hub
          </Link>
          <div className="ee-title-block">
            <h1>💛 Emotion Explorer</h1>
          </div>
          <button className="ee-restart-btn" onClick={() => initializeGame(currentLevel)}>
            <RotateCcw size={15} /> Restart
          </button>
        </div>

        {/* Level Buttons */}
        <div className="ee-level-row">
          {LEVEL_CONFIG.map(c => {
            const unlocked = highestUnlocked >= c.level;
            return (
              <button
                key={c.level}
                onClick={() => unlocked && setCurrentLevel(c.level)}
                className={`ee-level-btn ${currentLevel === c.level ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                disabled={!unlocked}
              >
                {unlocked ? c.emoji : <Lock size={11} />} Lvl {c.level}
              </button>
            );
          })}
          {highestUnlocked < LEVEL_CONFIG.length && (
            <button className="ee-parent-btn" onClick={() => setShowParentModal(true)}>
              <Unlock size={11} /> Parent Mode
            </button>
          )}
        </div>

        {/* Stats Bar */}
        {!gameWon && (
          <div className="ee-stats">
            <div className="ee-stat-item">
              <span className="ee-stat-label">Question</span>
              <span className="ee-stat-value">📖 {currentIndex + 1}/{scenarios.length}</span>
            </div>
            <div className="ee-stat-divider" />
            <div className="ee-stat-item">
              <span className="ee-stat-label">Correct</span>
              <span className="ee-stat-value">✅ {correctCount}</span>
            </div>
            <div className="ee-stat-divider" />
            <div className="ee-stat-item">
              <span className="ee-stat-label">Tries</span>
              <span className="ee-stat-value">👣 {moves}</span>
            </div>
            <div className="ee-stat-divider" />
            <div className="ee-stat-item">
              <span className="ee-stat-label">Time</span>
              <span className="ee-stat-value">⏱ {fmtTime(elapsedSec)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Game Area ── */}
      <div className="ee-main">
        {gameWon ? (
          /* ── WIN SCREEN ── */
          <div className="ee-win-wrap">
            <div className="ee-win-card">
              <div className="ee-win-strip" />
              <span className="ee-win-emoji">🎉</span>
              <h2>Wonderful Job!</h2>
              <p className="ee-win-sub">
                You understand feelings so well! {earnedStars === 3 ? 'Perfect round! 🌟' : 'Keep practising to get 3 stars! ⭐'}
              </p>

              <div className="ee-win-stars">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={`ee-win-star ${i >= earnedStars ? 'empty' : ''}`}>⭐</span>
                ))}
              </div>

              <div className="ee-win-meta">
                <div className="ee-win-meta-item">
                  <span>Correct</span><span>✅ {correctCount}/{scenarios.length}</span>
                </div>
                <div className="ee-win-meta-item">
                  <span>Tries</span><span>👣 {moves}</span>
                </div>
                <div className="ee-win-meta-item">
                  <span>Time</span><span>⏱ {fmtTime(elapsedSec)}</span>
                </div>
              </div>

              <div className="ee-win-btn-row">
                <button className="ee-btn-secondary" onClick={() => initializeGame(currentLevel)}>
                  <RotateCcw size={15} /> Play Again
                </button>
                {currentLevel < LEVEL_CONFIG.length && (
                  <button className="ee-btn-primary" onClick={() => setCurrentLevel(currentLevel + 1)}>
                    Next Level <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          currentScenario && (
            <>
              {/* Level badge */}
              <div className="ee-level-badge">
                {config.emoji} Level {config.level}: {config.label}
                <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>— {config.description}</span>
              </div>

              {/* Progress dots */}
              <div className="ee-progress-row">
                {scenarios.map((_, i) => (
                  <div
                    key={i}
                    className={`ee-progress-dot ${i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''}`}
                  />
                ))}
                <span className="ee-progress-label">{currentIndex + 1} / {scenarios.length}</span>
              </div>

              {/* Scenario Card */}
              <div className={`ee-scenario-card ${
                feedback?.type === 'correct'   ? 'state-correct' :
                feedback?.type === 'incorrect' ? 'state-incorrect' : ''
              }`}>
                <span className="ee-category-badge">
                  {currentScenario.category}
                </span>

                {feedback?.type === 'correct' ? (
                  <div className="ee-feedback-wrap">
                    <span className="ee-feedback-emoji">{currentScenario.emoji}</span>
                    <div className="ee-feedback-title">
                      That's right — they feel <em>{currentScenario.correct}</em>!
                    </div>
                    <div className="ee-feedback-sub">🌟 Great empathy!</div>
                  </div>
                ) : (
                  <p className="ee-scenario-text">
                    "{currentScenario.text}"
                  </p>
                )}
              </div>

              {/* Tip box — shows after wrong answer */}
              {feedback?.type === 'incorrect' && (
                <div className="ee-tip-box">
                  💡 Hint: {currentScenario.tip}
                </div>
              )}

              {/* Question Prompt */}
              <p className="ee-question-prompt">
                🤔 How does this make them feel?
              </p>

              {/* Option Buttons */}
              <div className="ee-options-grid">
                {currentScenario.options.map((opt, i) => {
                  let btnClass = 'ee-option-btn';
                  if (feedback?.type === 'correct'   && opt === currentScenario.correct) btnClass += ' correct-flash';
                  if (feedback?.type === 'incorrect' && opt === feedback.selected)        btnClass += ' wrong-flash';

                  return (
                    <button
                      key={i}
                      className={btnClass}
                      onClick={() => handleOptionClick(opt)}
                      disabled={feedback !== null}
                    >
                      <span className="ee-option-emoji">
                        {EMOTION_EMOJI[opt] || '❓'}
                      </span>
                      <span className="ee-option-label">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}