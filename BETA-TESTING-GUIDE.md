# Heartbeat Studio — Beta Testing Guide

---

## PHASE 1: LANDING PAGE

1. Open the app — verify the hero section loads with a background image, headline text, and call-to-action buttons
2. Scroll down and review all feature showcase cards — verify images and descriptions are present
3. Scroll to the pricing section — verify three tiers are displayed:
   - Free: 3 credits
   - Credit Pack: $4.99 for 5 credits (labeled "Most Popular")
   - Subscription: $10/month for 15 credits (labeled "Best Value")
4. Click "Get Started" or "Sign Up" — verify it navigates to registration
5. Click the Terms of Service link at the bottom — verify the /terms page loads and is readable

---

## PHASE 2: ACCOUNT & AUTHENTICATION

### Email/Password Registration
6. Click "Sign Up" and attempt to submit with empty fields — verify validation messages appear
7. Enter a valid email and password — verify the Terms of Service checkbox is required before submission
8. Check the Terms of Service checkbox and submit — verify account is created and you're logged in
9. Verify your name and email appear in the app header/sidebar

### Logout & Login
10. Log out — verify you're redirected to the landing page and all user data is cleared
11. Log back in with email and password — verify dashboard loads with your data

### Magic Link Login
12. Log out again
13. On the login page, enter your email and request a magic link
14. Check your email inbox — verify a magic link email arrives from the configured sender
15. Click the magic link — verify you're logged in and redirected to the dashboard
16. Try clicking the same magic link a second time — verify it is rejected (one-time use)

### Google OAuth
17. Log out
18. Click "Sign in with Google" — complete the Google OAuth flow
19. Verify your Google name and profile image appear in the app
20. Log out and log back in with Google — verify session persistence works

---

## PHASE 3: DASHBOARD

21. After logging in, verify the dashboard shows: loved ones section, upcoming celebrations section, and creation stats
22. Verify the creation stats (songs, cards, animations) start at 0 for a new account
23. Click every navigation link from the dashboard — verify each page loads without errors
24. Return to the dashboard after creating content later — verify stats update correctly

---

## PHASE 4: LOVED ONES MANAGEMENT

### Adding Loved Ones
25. Click "Add Loved One" — verify the form opens
26. Fill in all fields: name, nickname, relationship (try "Mother"), birthday (e.g., 03-15), interests (e.g., "cooking, gardening"), inside jokes (e.g., "the pancake incident")
27. Submit — verify the loved one appears on your dashboard with correct details
28. Add a second loved one with only name and relationship (minimal info) — verify it saves

### Editing & Deleting
29. Click to edit the first loved one — change their nickname and add new interests
30. Save — verify the changes are reflected immediately
31. Delete the second loved one — verify a confirmation prompt appears
32. Confirm deletion — verify the loved one is removed from the list

---

## PHASE 5: SONG CREATION — LOVED ONES TAB

### Basic Song Generation
33. Navigate to the Create page, ensure the "Loved Ones" tab is selected
34. Select a loved one as the recipient
35. Pick occasion: "Birthday"
36. Pick tone: "Celebratory"
37. Pick genre: "R&B"
38. Choose voice: "Female"
39. Choose duration: "Extended" (~3 minutes)
40. Choose language: "English"
41. Submit — verify a loading/progress indicator appears
42. Wait for the AI questionnaire — answer the personalized follow-up questions about the recipient
43. After answering, wait for the song to generate
44. Once generated: click play and verify audio plays correctly
45. Read the lyrics — verify they reference the recipient's name and personal details you provided
46. View the cover art — verify an image was generated

### Testing Different Occasions
47. Create a new song with occasion: "Anniversary", tone: "Romantic", genre: "Neo-Soul"
48. Create a new song with occasion: "Graduation", tone: "Proud", genre: "Gospel"
49. Create a new song with occasion: "Thank You", tone: "Grateful", genre: "Jazz"
50. Create a new song with occasion: "Love", tone: "Heartfelt", genre: "Pop"
51. Create a new song with occasion: "Missing You", tone: "Sweet", genre: "Country"

### Testing Genres with Sub-Genres
52. Create a song with genre: "Rap" — verify rap sub-genre dropdown appears
53. Select sub-genre: "Trap" — generate and verify the song has a trap beat
54. Create another rap song with sub-genre: "Boom Bap" — verify distinctly different style
55. Try sub-genres: "Conscious Rap", "Melodic Rap", "Old School", "Drill" — verify each sounds different
56. Create a song with genre: "Jazz" — verify jazz sub-genre dropdown appears
57. Select sub-genre: "Smooth Jazz" — generate and verify smooth jazz style
58. Try sub-genres: "Bebop", "Latin Jazz", "Vocal Jazz" — verify distinct styles

### Testing Voice Options
59. Create a song with voice: "Male" — verify male vocals
60. Create a song with voice: "Female" — verify female vocals
61. Create a song with voice: "Duet (Male & Female)" — verify both voices appear

### Testing Artist Inspiration
62. Create a song and type "Adele" in the artist inspiration field — verify the song has a similar vocal/musical style
63. Create another song with artist inspiration "Drake" — verify hip-hop influence
64. Create another song with artist inspiration "Kirk Franklin" — verify gospel influence

### Testing Language Support
65. Create a song in Spanish — verify lyrics are in Spanish
66. Create a song in French — verify lyrics are in French
67. Create a song in Mandarin — verify lyrics are in Mandarin

### Try Again Options
68. After a song is generated, click "Try Again"
69. Select "Change Genre" — pick a completely different genre (e.g., switch from R&B to Electronic) — verify a new song generates in the new genre
70. Click "Try Again" again — select "Give Feedback" — type "Make the chorus more upbeat and add more personal details" — verify the regenerated song reflects your feedback
71. Click "Try Again" again — select "Edit Lyrics" — modify a few lines in the lyrics editor — verify the song regenerates with your edited lyrics

### Quick Duration
72. Create a song with duration: "Quick" (~1 minute) — verify the song is noticeably shorter than extended songs

---

## PHASE 6: SONG CREATION — BUSINESS TAB

### Quick Start Categories
73. Switch to the Business tab
74. Click "Employee Recognition" quick start — verify appropriate fields appear
75. Go back and click "Client Appreciation" — verify fields change appropriately
76. Go back and click "Team Milestones"
77. Go back and click "Onboarding Welcome"
78. Go back and click "Company Events"

### Business Song Generation
79. Select "Employee Recognition" — fill in employee name, occasion: "Work Anniversary", tone: "Warm"
80. Pick genre: "Pop" — generate the song
81. Play the audio — verify it sounds professional and workplace-appropriate
82. Read the lyrics — verify they reference the employee and occasion appropriately
83. Verify the language is workplace-appropriate (no slang, no inappropriate content)

### Reel Music Creator
84. Go back and click "Reel Music" quick start
85. Enter a brand name (e.g., "Sunrise Coffee")
86. Select content niche: "Food & Cooking"
87. Select vibe: "Warm & Feel-Good"
88. Select genre: "Acoustic"
89. Select duration: "Short (30-60s)"
90. Toggle "Instrumental" on — verify the description mentions "no vocals" / "pure background music"
91. Generate — verify the result is instrumental background music suitable for social media
92. Create another reel with instrumental off — verify it includes vocals
93. Try a different niche: "Fitness & Health", vibe: "Upbeat & Energetic", genre: "EDM" — generate and compare
94. Try niche: "Business & Finance", vibe: "Confident & Boss", genre: "Hip-Hop" — generate and compare

### Business Tones
95. Create songs testing each business tone: Professional, Warm, Celebratory, Inspirational, Grateful, Friendly — verify each produces a noticeably different feel

---

## PHASE 7: SONG CREATION — EDUCATION TAB

### Quick Start Categories
96. Switch to the Education tab
97. Click "Graduation" quick start — verify graduation-specific fields appear
98. Go back and click "Classroom Cheers" — verify classroom-specific options
99. Go back and click "Teacher Appreciation"
100. Go back and click "Academic Awards"
101. Go back and click "School Spirit"
102. Go back and click "Learning Songs"
103. Go back and click "Yearbook"

### Education Song Generation — Student Encouragement
104. Select "Classroom Cheers" quick start
105. Enter a student name, school name, and mascot
106. Select grade level (e.g., "5th Grade")
107. Select tone: "Encouraging"
108. Select genre: "Pop"
109. Generate the song
110. Play audio — verify it sounds age-appropriate and encouraging
111. Read the lyrics — verify they include the student's name, school name, and are grade-appropriate (no complex vocabulary for young students)
112. Verify the content is school-safe (no inappropriate language or themes)

### Education Song Generation — Teacher Appreciation
113. Select "Teacher Appreciation" quick start
114. Enter a teacher's name and subject they teach
115. Select tone: "Grateful"
116. Select genre: "R&B"
117. Generate and verify the lyrics thank the teacher with appropriate references

### Education Song Generation — Graduation
118. Select "Graduation" quick start
119. Enter the graduate's name, school, and year
120. Select tone: "Proud"
121. Select genre: "Gospel"
122. Generate and verify the lyrics celebrate the achievement appropriately

### Education Song Generation — School Spirit
123. Select "School Spirit" quick start
124. Enter school name, mascot, and school colors
125. Select tone: "Uplifting"
126. Select genre: "Hip-Hop"
127. Generate — verify the song references the school identity and feels like a school anthem

### Education Song Generation — Academic Awards
128. Select "Academic Awards" quick start
129. Enter student name and award type (e.g., "Spelling Bee Champion")
130. Select tone: "Celebratory"
131. Generate — verify the lyrics celebrate the specific achievement

### Education Song Generation — Learning Songs
132. Select "Learning Songs" quick start
133. Enter a subject/topic (e.g., "Multiplication tables")
134. Select an appropriate genre
135. Generate — verify the song teaches or relates to the academic subject

### Education Tones
136. Create education songs testing each tone: Sweet, Uplifting, Humorous, Proud, Encouraging — verify each feels distinctly different

---

## PHASE 8: EXPERIENCE KITS

### Date Night Experience
137. Start the Date Night Experience
138. Generate song 1 — verify it sets a romantic opening mood
139. Generate song 2 — verify emotional progression (deeper/more intimate)
140. Generate song 3 — verify it provides a meaningful closing
141. Play all 3 in sequence — verify they flow together as a curated experience

### Birthday Blast Experience
142. Start the Birthday Blast Experience
143. Generate all 5 birthday songs — verify each has a unique angle/style
144. Play each song and verify audio quality

### Gospel Greeting Experience
145. Start the Gospel Greeting Experience
146. Generate both gospel-inspired messages
147. Verify scripture references are included and accurate
148. Play audio and verify gospel musical style

### Classroom Cheers Experience
149. Start the Classroom Cheers Experience
150. Generate all 5 group songs
151. Verify each is school-appropriate and encouraging
152. Play each and verify audio quality

### Sung Prayer Experience
153. Start the Sung Prayer Experience
154. Generate all 3 prayer songs
155. Verify the structure follows: Song 1 = Thanksgiving, Song 2 = Declaration, Song 3 = Promises
156. Play each and verify the progression

---

## PHASE 9: GREETING CARD — AI GENERATED COVER (LOVED ONES TAB)

157. Start creating a greeting card in the Loved Ones tab
158. Select a loved one as recipient
159. Select "AI Generated" as the cover image source
160. Select occasion: "Birthday"
161. Select tone: "Celebratory"
162. Write a personal message
163. Submit — verify the AI generates both a cover image and a card message
164. View the completed card — verify layout, image, and message display correctly
165. Try another card with occasion: "Anniversary", tone: "Romantic" — verify different style

---

## PHASE 10: GREETING CARD — FAMILY PORTRAIT COVER (LOVED ONES TAB)

### Photo Upload & Face Detection
166. Select "Family Portrait" as the cover image source
167. Upload 2 photos of different people
168. Wait for face detection — verify each detected face appears with a thumbnail and selection checkbox
169. Upload 2 more photos (total 4) — verify additional faces are detected
170. Try uploading 7+ photos — verify the limit of 6 is enforced

### Scene & Style Selection
171. Select the faces to include (at least 2)
172. Choose scene category: "Holidays", specific scene: "Christmas"
173. Choose style: "Festive Photo" — generate and review
174. Use "Same People, New Scene" — try "Watercolor" style — verify same faces, different art style
175. Choose scene category: "Life Events", scene: "Wedding" — generate and compare
176. Choose scene category: "Seasons", scene: "Summer Beach" — generate and compare
177. Choose scene category: "Professional", scene: "Corporate Headshot" — generate and compare
178. Choose scene category: "Blast from the Past", scene: "Fresh Prince Style" — generate and compare
179. Choose scene category: "Gaming", scene: "2K Player Card" — generate and compare

### Outfit & Retouching Options
180. Toggle "Keep original outfits" OFF — generate and verify clothing changes to match the scene
181. Toggle "Keep original outfits" ON — generate and verify original clothing is preserved
182. If any person has dental braces, check "Remove braces" for that person — generate and verify braces are removed
183. Check "Remove glasses" if applicable — generate and verify

### Same People, New Scene Quick Presets
184. After creating a portrait card, click "Same People, New Scene"
185. Try preset: "Christmas Card" — verify it generates without re-uploading photos
186. Try preset: "Vacation Postcard"
187. Try preset: "Studio Portrait"
188. Try preset: "Birthday Cartoon"
189. Try preset: "Watercolor Art"
190. Try preset: "Classic Painting"

---

## PHASE 11: GREETING CARD — FESTIVE TRANSFORM (LOVED ONES TAB)

### Holidays Scene Category
191. Select "Festive Transform" as cover source
192. Upload a single person's photo
193. Select Scene: "Holidays", Holiday: "Christmas" — generate and verify Christmas scene with person's face
194. Regenerate with Holiday: "Hanukkah" — verify menorah and blue/white decorations
195. Regenerate with Holiday: "Kwanzaa" — verify kinara and red/black/green theme
196. Regenerate with Holiday: "New Year's" — verify confetti and countdown elements
197. Regenerate with Holiday: "Easter" — verify spring/pastel theme
198. Regenerate with Holiday: "Halloween" — verify spooky/fun theme
199. Regenerate with Holiday: "Valentine's Day" — verify hearts and romance
200. Regenerate with Holiday: "Diwali" — verify diyas and rangoli patterns
201. Regenerate with Holiday: "Eid" — verify crescent moon and lanterns
202. Regenerate with Holiday: "Lunar New Year" — verify red lanterns and zodiac elements
203. Regenerate with Holiday: "Fourth of July" — verify patriotic red/white/blue
204. Regenerate with Holiday: "Mother's Day" — verify flowers and warm theme
205. Regenerate with Holiday: "Father's Day" — verify masculine/family theme
206. Regenerate with Holiday: "Cinco de Mayo" — verify papel picado and festive Mexican theme
207. Regenerate with Holiday: "Thanksgiving" — verify autumn harvest theme
208. Regenerate with Holiday: "St. Patrick's Day" — verify shamrocks and green theme
209. Regenerate with Holiday: "Passover" — verify seder elements

### Life Events Scene Category
210. Select Scene: "Life Events", Event: "Birthday Party" — generate and verify
211. Regenerate with Event: "Graduation" — verify cap and gown elements
212. Regenerate with Event: "Wedding" — verify romantic/elegant theme
213. Regenerate with Event: "Baby Shower" — verify pastel/baby theme
214. Regenerate with Event: "Anniversary" — verify romantic celebration
215. Regenerate with Event: "Retirement" — verify congratulatory theme

### Seasons Scene Category
216. Select Scene: "Seasons", Season: "Winter Wonderland" — generate and verify
217. Regenerate with Season: "Spring Garden" — verify flowers and green
218. Regenerate with Season: "Summer Beach" — verify ocean and sand
219. Regenerate with Season: "Autumn Harvest" — verify fall colors and pumpkins

### Professional Scene Category
220. Select Scene: "Professional", Type: "Corporate Headshot" — generate and verify clean professional look
221. Regenerate with Type: "LinkedIn Profile" — verify approachable business look
222. Regenerate with Type: "Business Casual" — verify modern office setting
223. Regenerate with Type: "Executive Portrait" — verify distinguished look
224. Regenerate with Type: "Realtor Photo" — verify warm/welcoming
225. Regenerate with Type: "Author Photo" — verify bookshelf/intellectual
226. Regenerate with Type: "Medical Professional" — verify clinical setting
227. Regenerate with Type: "Tech Startup" — verify modern/casual vibe

### Blast from the Past Scene Category
228. Select Scene: "Blast from the Past", Style: "1970s Groovy" — generate and verify retro 70s vibe
229. Regenerate with Style: "1980s Neon" — verify neon/synth wave aesthetic
230. Regenerate with Style: "1990s Throwback" — verify 90s aesthetic
231. Regenerate with Style: "Classic Sitcom Living Room" — verify TV set look
232. Regenerate with Style: "Fresh Prince Style" — verify Bel-Air mansion
233. Regenerate with Style: "Family Matters Style" — verify Winslow home
234. Regenerate with Style: "Martin Style" — verify 90s Detroit apartment
235. Regenerate with Style: "Old Western" — verify frontier town
236. Regenerate with Style: "Hip Hop Crew Photo" — verify urban/graffiti backdrop
237. Regenerate with Style: "Soul Train Stage" — verify disco/funk aesthetic
238. Check "Include TV show characters" for a TV show style — verify original show characters appear alongside the person

### Gaming Scene Category
239. Select Scene: "Gaming", Game Style: "Gaming Moments" — generate and verify gaming aesthetic
240. Regenerate with Game Style: "2K Player Card" — verify basketball card layout
241. Regenerate with Game Style: "Battle Royale (Fortnite)" — verify Fortnite UI
242. Regenerate with Game Style: "GTA / Street Style" — verify urban/GTA aesthetic
243. Regenerate with Game Style: "Minecraft" — verify pixel/block style
244. Regenerate with Game Style: "Roblox" — verify colorful avatar world
245. Regenerate with Game Style: "Retro Arcade" — verify 8-bit pixel art

### Custom Instructions & Art Styles
246. Add custom instructions: "Make the background more colorful and add sparkles" — generate and verify instructions influenced the result
247. Change the art style to "Cartoon" — verify cartoon rendering
248. Change to "Watercolor" — verify watercolor painting style
249. Change to "Oil Painting" — verify oil painting texture
250. Change to "Digital Art" — verify digital art look
251. Change to "Vintage" — verify sepia/vintage aesthetic

### Face Preservation Check
252. For every generation above, verify the person's face, skin tone, hair, and glasses (if applicable) are preserved accurately

---

## PHASE 12: GREETING CARD — FESTIVE TRANSFORM (BUSINESS TAB)

253. Switch to Business tab, select Festive Transform
254. Upload a professional headshot photo
255. Test Scene: "Professional Celebration" with styles: Elegant Confetti, Subtle Sparkle, Achievement Glow, Polished Cheers — generate each
256. Test Scene: "Milestone Moment" with styles: Promotion Spotlight, Work Anniversary, Career Growth — generate each
257. Test Scene: "Team Celebration" with styles: Team Win, Collective Success, Collaboration Energy — generate each
258. Test Scene: "Client Appreciation" with styles: Thank You Elegant, Premium Gratitude, Partnership Celebration — generate each
259. Test Scene: "Event & Gathering" with styles: Company Event, Conference Energy, Networking Night — generate each
260. Test Scene: "Seasonal Festive (Business-Safe)" with styles: Winter Neutral, Year-End Celebration — generate each
261. Test Scene: "Brand Celebration" with styles: Logo Spotlight, Brand Colors Festive — generate each
262. Test Scene: "Modern Abstract Festive" with styles: Gradient Motion, Abstract Spark — generate each
263. Test Scene: "Gaming" with styles: 2K Player Card, Battle Royale, Minecraft — generate each
264. For every result: verify the image looks professional and workplace-appropriate

---

## PHASE 13: GREETING CARD — FESTIVE TRANSFORM (EDUCATION TAB)

265. Switch to Education tab, select Festive Transform
266. Upload a student or teacher photo
267. Test Scene: "Student Celebration" with styles: You Did It!, Star Student, Celebration Confetti — generate each
268. Test Scene: "Academic Achievement" with styles: Honor Roll, Perfect Attendance, Gold Star — generate each
269. Test Scene: "Graduation" with styles: Class of 20XX, Cap & Gown, Proud Graduate — generate each
270. Test Scene: "Teacher Appreciation" with styles: Thank You Teacher, Classroom Hero, Making a Difference — generate each
271. Test Scene: "Classroom Celebration" with styles: Class Success, We Did It!, Learning Together — generate each
272. Test Scene: "School Spirit" with styles: School Pride, Mascot Energy, Go Team! — generate each
273. Test Scene: "Learning Journey" with styles: Growth Path, Learning Milestones, Progress Map — generate each
274. Test Scene: "Festive School Celebration" with styles: End of Year, Back to School, Classroom Party — generate each
275. Test Scene: "Fun & Encouraging" with styles: Bright & Happy, Color Pop, Confetti Fun — generate each
276. Test Scene: "Minimal Academic" with styles: Clean Classroom, Calm Celebration, Simple Success — generate each
277. Test Scene: "Gaming" with styles: Minecraft, Roblox, 2K Player Card, Retro Arcade — generate each
278. For every result: verify the image is school-safe and age-appropriate

---

## PHASE 14: GAMING CARD COVER — LOVED ONES TAB

### 2K Player Card Style
279. Select "Gaming Card" as cover source in the Loved Ones tab
280. Set Game Style to "2K Player Card"
281. Enter username: a person's name (e.g., "Danielle Horton")
282. Enter overall rating: "99"
283. Enter position: "Point Guard"
284. Enter team: "Horton's Tech"
285. Enter stats: "Loyalty 99, Love 100, Hustle 95"
286. Upload a player photo
287. Click "Generate Gaming Card" — verify loading spinner appears
288. Once generated: verify the card shows the correct face in a basketball uniform
289. Verify the team name "Horton's Tech" is spelled correctly on the card
290. Verify the rating "99", position "Point Guard", and stats are visible
291. Click the generated image — verify it opens in a full-screen scrollable dialog
292. Scroll down in the dialog — verify you can see the entire card including stats at the bottom
293. Close the dialog
294. Click "Regenerate" — verify a new version generates

### Battle Royale Style
295. Change Game Style to "Battle Royale (Fortnite)"
296. Enter username, set level/XP, rank: "Diamond", squad name
297. Enter stats: "Victory Royale, XP 5000"
298. Generate — verify Fortnite-themed UI with Victory Royale banner, colorful style

### GTA / Street Style
299. Change Game Style to "GTA / Street Style"
300. Enter character name, title: "Boss", crew name
301. Enter stats: "Cash: $1M, Respect: MAX"
302. Generate — verify GTA loading screen aesthetic with urban skyline

### Minecraft Style
303. Change Game Style to "Minecraft"
304. Enter username, level, world/server name
305. Enter stats: "Achievement Unlocked, Diamonds: 64"
306. Generate — verify blocky pixel art world with Minecraft UI elements

### Roblox Style
307. Change Game Style to "Roblox"
308. Enter username, level, group name
309. Generate — verify colorful Roblox world with avatar-style characters

### Retro Arcade Style
310. Change Game Style to "Retro Arcade"
311. Enter username, high score: "999,999", rank
312. Generate — verify 8-bit pixel art with CRT scanline effects and arcade cabinet border

### Without Photo
313. Remove the uploaded photo
314. Generate a 2K Player Card without a photo — verify it still generates a complete card

### Gaming Card Scenes
315. Change Scene to "Esports Celebration" with style "2K Player Card" — generate and verify championship/esports backdrop
316. Change Scene to "Level Up / Achievement" — generate and verify level-up effects
317. Change Scene to "Victory / Win" — generate and verify victory scene
318. Change Scene to "Character Spotlight" — generate and verify hero pose spotlight

---

## PHASE 15: GAMING CARD COVER — BUSINESS & EDUCATION TABS

319. Switch to Business tab — select Gaming Card cover — fill in details — generate and verify it works
320. Switch to Education tab — select Gaming Card cover — fill in student details — generate and verify it works
321. Upload photos in each tab — verify photo incorporation works across all tabs
322. Click generated images in each tab — verify full-screen dialog works everywhere

---

## PHASE 16: GREETING CARD — UPLOAD & NO IMAGE

323. Select "Upload Image" as cover source
324. Upload a JPG image — verify it appears as the card cover preview
325. Upload a PNG image — verify it works
326. Remove the uploaded image — verify it clears and the upload button reappears
327. Select "No Image" — create and submit a card without any cover — verify it saves successfully

---

## PHASE 17: YEARBOOK HEADSHOT (EDUCATION TAB)

328. Switch to Education tab, select "Yearbook" quick start
329. Upload a student photo
330. Select background color: "Classic Blue" — generate and verify blue backdrop
331. Try background: "Navy", "Maroon", "Forest Green" — verify each color renders correctly
332. Select portrait style: "Classic" — generate and verify traditional look
333. Try styles: "Modern", "Formal", "Friendly", "Dramatic" — verify each looks distinct
334. Check "Remove glasses" — generate and verify glasses are removed
335. Check "Remove braces" — generate and verify braces are removed
336. Test with both checkboxes checked simultaneously

---

## PHASE 18: CLASS PORTRAIT (EDUCATION TAB)

337. Select class portrait/card creation in the Education tab
338. Upload 3-5 student/teacher photos
339. Wait for face detection — verify all faces are detected
340. Select faces to include
341. Choose scene: "Classroom Portrait" — generate and verify classroom backdrop
342. Try scene: "Formal Group" — verify yearbook-quality studio backdrop
343. Try scene: "Campus/Outdoors" — verify outdoor school setting
344. Try scene: "Teacher & Class" — verify teacher-centered composition
345. Try scene: "Achievement Class" — verify gold stars and achievement elements
346. Try scene: "Fun & Friendly (Elementary)" — verify bright, child-friendly setting
347. Try scene: "Minimal Portrait" — verify clean studio backdrop

---

## PHASE 19: SONG ATTACHMENT TO CARDS

348. Create a greeting card
349. In the card creation form, find the option to attach a song
350. Select a previously generated song from your library
351. Submit the card
352. View the completed card — verify the song auto-plays or has a play button when the card is opened
353. Open the card's shareable link — verify the song plays for viewers too

---

## PHASE 20: ANIMATION CREATION

354. Navigate to the animation creation section
355. Enter a celebration description (e.g., "Happy birthday confetti explosion")
356. Select style: "Cartoon" — generate and wait for completion
357. Verify progress/status updates appear during generation
358. Once complete, play the animation — verify video playback works
359. Generate another with style: "Anime" — verify anime art style
360. Generate with style: "3D" — verify 3D rendered look
361. Generate with style: "Watercolor" — verify painted style
362. Generate with style: "Pixar" — verify Pixar-like quality
363. Generate with style: "Realistic" — verify photorealistic style
364. Verify each style produces visually distinct results

---

## PHASE 21: SCHEDULING & DELIVERY

365. Create a card or song
366. Set a delivery date in the future (e.g., tomorrow)
367. Set a delivery time
368. Submit — verify the creation is saved with "Scheduled" status
369. Check the dashboard — verify the scheduled creation appears with the correct date/time
370. Verify status labels: "Draft", "Scheduled", "Sent" display correctly

---

## PHASE 22: SHARING

371. Find a completed creation on your dashboard
372. Generate a shareable link
373. Copy the link
374. Open the link in a private/incognito browser window (not logged in)
375. Verify the shared creation displays correctly: card image, message, recipient name
376. If the creation has a song attached, verify audio playback works for the anonymous viewer
377. If the creation has an animation, verify video playback works
378. Try sharing links for different creation types (song only, card only, card with song, animation)

---

## PHASE 23: CREDITS & PAYMENTS

### Viewing Credits
379. Check your current credit balance on the dashboard or header
380. Verify new free accounts start with 3 credits

### Pricing Page
381. Navigate to the pricing page
382. Verify "Free" tier shows: 3 credits, feature list
383. Verify "Credit Pack" tier shows: $4.99 for 5 credits, labeled "Most Popular"
384. Verify "Subscription" tier shows: $10/month for 15 credits, labeled "Best Value"

### Purchasing Credits
385. Click to purchase a Credit Pack — verify Stripe checkout page loads
386. Complete the Stripe payment with a test card
387. After payment, verify your credit balance increased by 5
388. Verify a confirmation/receipt is shown

### Subscription
389. Click to purchase a Subscription — verify Stripe checkout loads
390. Complete the payment
391. Verify subscription status shows "Active"
392. Verify credits are updated to 15

### Credit Deduction
393. Create a piece of content (song, card, or animation)
394. After creation, verify your credit balance decreased by the correct amount
395. Note the credit cost and verify it matches what's documented

### Zero Credits
396. Use up all remaining credits (or test with a fresh free account)
397. Attempt to create something with 0 credits
398. Verify a clear error message appears explaining you need more credits
399. Verify a link/button directs you to the pricing page

---

## PHASE 24: ADMIN DASHBOARD

### Admin Access
400. Log in as an admin user
401. Navigate to /admin — verify the admin dashboard loads

### User Statistics
402. Verify the following stats are displayed: total users, 7-day signups, 30-day signups, active subscribers, marketing opt-ins
403. Verify the numbers look reasonable (compare to what you know about test accounts)

### User Management
404. View the full user list — verify names and emails appear
405. Search for a specific user by name — verify search filters correctly
406. Search for a user by email — verify results
407. Filter by "Marketing opt-ins" — verify only opted-in users appear
408. Filter by "Subscribers" — verify only subscribers appear
409. Clear filters — verify full list returns

### CSV Export
410. With filters applied, click "Export CSV"
411. Open the downloaded CSV file — verify it contains the correct filtered user data
412. Export without filters — verify it contains all users

### Non-Admin Access
413. Log in as a regular (non-admin) user
414. Try navigating directly to /admin
415. Verify you are redirected away (to the dashboard)

---

## PHASE 25: BUSINESS TAB — CARD CREATION DETAILS

### Business Portrait (Team Photo)
416. In the Business tab, select "Portrait" (team photo) as cover source
417. Upload 2-4 professional photos
418. Wait for face detection
419. Choose a business scene: "Office" — generate
420. Try scene: "Conference Room" — generate
421. Try scene: "Achievement Spotlight" — generate
422. Try scene: "Brand/Company Colors" — generate
423. Verify all results look professional

### Business Card Styles
424. Create a business card with style: "Minimalist" — verify clean design
425. Try style: "Modern" — verify contemporary look
426. Try style: "Corporate" — verify formal business feel
427. Try style: "Elegant" — verify refined design

### Business Occasions
428. Create cards for each business occasion: Promotion, Work Anniversary, Retirement, Welcome/Onboarding, Thank You, Project Launch, Company Milestone, Holiday Greeting, Birthday, Congratulations
429. Verify each occasion generates appropriate messaging

### Business Recipient Roles
430. Create a card for recipient role: "Employee" — verify appropriate tone
431. Try: "Manager", "Executive", "Client", "Partner", "The Team" — verify messaging adapts

---

## PHASE 26: CROSS-PLATFORM TESTING

### Mobile
432. Open the app on a mobile phone
433. Test the landing page — verify responsive layout, no horizontal scrolling
434. Test registration/login on mobile
435. Test the dashboard — verify single-column layout
436. Test song creation form on mobile — verify all dropdowns and inputs work
437. Test card creation on mobile — verify image upload and preview work
438. Test gaming card generation on mobile
439. Test full-screen image dialog on mobile — verify scrolling works

### Tablet
440. Test on a tablet — verify 2-column grid layouts display correctly
441. Test all creation forms on tablet

### Desktop
442. Test at full-screen width
443. Resize the browser window to various widths — verify responsive breakpoints work
444. Verify no elements overflow or overlap at any width

---

## PHASE 27: ERROR HANDLING & EDGE CASES

### File Upload Errors
445. Upload an extremely large image (10MB+) — verify graceful error message
446. Upload a non-image file (e.g., .pdf, .txt) where an image is expected — verify rejection with clear message
447. Upload a corrupted image file — verify error handling

### Form Validation
448. Submit every form with empty required fields — verify validation messages appear for each field
449. Enter an invalid email format during registration — verify error
450. Enter a very short password — verify minimum length enforcement
451. Enter extremely long text (500+ characters) in all input fields — verify layout doesn't break

### Generation Failures
452. If a song generation fails, verify the error message is clear and mentions credit refund
453. Verify failed songs show "Song Feature Currently Updating" message
454. If an image generation fails, verify a clear error toast appears

### Rapid Interactions
455. Rapidly click a "Generate" button multiple times — verify only one generation starts (no duplicates)
456. Navigate away from the page during a song generation — navigate back — verify the state is handled
457. Open the app in two browser tabs — create content in both — verify no conflicts

### Network Issues
458. Use browser dev tools to throttle to "Slow 3G" — test a song generation — verify timeout handling
459. Disconnect from the internet during a generation — verify error message appears
460. Reconnect and retry — verify recovery works
