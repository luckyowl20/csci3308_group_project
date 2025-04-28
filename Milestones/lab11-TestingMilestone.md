# User Acceptance Testing (UAT) Plan

This document outlines the UAT plans for core features in the application. These plans will verify that essential user-facing functionality works as intended from a user perspective, for part B section 13 of lab 11 for CSCI 3308.

---

## Feature 1: Live Chat Functionality (Expanded)

This section verifies that the real-time messaging system using Socket.IO functions correctly between users, including success, error, and edge cases.

---

### Test Case 1.1 – Successful Message Sent and Received

- **Goal:** Ensure real-time delivery of messages between two friends.
- **Test Data:**  
  - User A: Alice (ID 1)  
  - User B: Bob (ID 2)  
  - Message: “Hey Bob, are you there?”
- **Steps:**  
  1. Alice logs in and navigates to `/chat`.  
  2. She selects Bob from her friend list and sends the message.  
  3. Bob (already logged in) views the message live.
- **Expected Result:** Message is delivered and displayed in real time for both users.
- **Actual Result:** : Test case passed clearly with not issues users were able to send and receive messages without any issues.

---

### Test Case 1.2 – Message Sent While Receiver Is Offline

- **Goal:** Ensure messages are still saved even if the recipient is not connected.
- **Test Data:**  
  - User A: Alice (ID 1)  
  - User B: Bob (ID 2 – not logged in)
- **Steps:**  
  1. Alice sends a message to Bob.  
  2. Bob logs in afterward and views the chat history.
- **Expected Result:** The message is saved to the database and appears in Bob's chat upon login.
- **Actual Result:** : This passed perfectly fine users were still able to send messages even if the other user is offline.

---

### Test Case 1.3 – Sending an Empty or Whitespace Message

- **Goal:** Prevent sending empty messages.
- **Test Data:**  
  - Message: `"   "` (spaces only)
- **Steps:**  
  1. User types a message with only spaces.  
  2. Clicks "Send".
- **Expected Result:** Message is not sent; an error or silent failure prevents it.
- **Actual Result:** : This worked no messages that had just pure whitespace where able to be sent between users.

---

### Test Case 1.4 – Message Sent to Non-Friend (Disallowed)

- **Goal:** Ensure users cannot send messages to others who are not their friends.
- **Test Data:**  
  - User A: Alice  
  - User B: Unknown user not on Alice’s friend list
- **Steps:**  
  1. Alice manually navigates to `/chat?receiver_id=99`.  
  2. Attempts to send a message.
- **Expected Result:** Backend rejects the message or shows an error; message is not saved.
- **Actual Result:** : Users can't accesses any messaging with someone that is not their freind as they are not in control of new chats so no issues here.

---

### Environment & Testers (All Chat Tests)

- **Environment:**  
  - `localhost:3000/chat`  
  - Socket.IO configured and running  
  - PostgreSQL with messages and friends tables

- **Testers:**  
  - TBD, likely Daniel or Matt

---

## Feature 2: Profile Editing (Expanded)

This section ensures users can manage their own profile details safely and reliably via the Edit Profile modal.

---

### Test Case 2.1 – Complete Profile Update

- **Goal:** Verify all fields update properly.
- **Test Data:**  
  - Display Name: "Charlie the Tester"  
  - Biography: "Testing profile updates."  
  - Interests: "Hiking, Music"  
  - Birthday: `2000-05-15`  
  - Profile Picture URL: `https://example.com/pic.jpg`
- **Steps:**  
  1. Charlie logs in and opens the Edit Profile modal.  
  2. Fills in all fields.  
  3. Clicks Save.  
  4. Page reloads.
- **Expected Result:** All fields reflect the new values on the page and remain on refresh.
- **Actual Result:** : All profile updates work as they should and the data is stored correctly as it should be.
  

---

### Test Case 2.2 – Partial Update

- **Goal:** Ensure partial updates (e.g., just changing the bio) are allowed.
- **Test Data:**  
  - Biography: "Updated bio only"
- **Steps:**  
  1. User opens modal.  
  2. Changes just the biography field.  
  3. Saves and reloads.
- **Expected Result:** Only the updated field changes, others remain intact.
- **Actual Result:** : This works correctly the user can update any part of the profile that they choose and no issues will arise with other profile settings or features.

---

### Test Case 2.3 – Invalid or Empty Inputs

- **Goal:** Prevent saving if required fields are invalid (e.g., bad URL format).
- **Test Data:**  
  - Profile Picture URL: `not-a-url`
- **Steps:**  
  1. User enters an invalid image URL and tries to save.
- **Expected Result:** App should reject or sanitize bad data and show feedback.
- **Actual Result:** : This works as it should every url will be valid as the only url's being passed in are straight from the supabase database.

---

### Test Case 2.4 – Unauthorized Edit Attempt

- **Goal:** Prevent users from editing someone else’s profile.
- **Test Data:**  
  - Logged in as Alice, attempts to edit Bob’s profile.
- **Steps:**  
  1. Alice navigates to `/users/2`  
  2. Checks for Edit button or tries to trigger modal manually.
- **Expected Result:** Edit modal is not accessible; changes are blocked by backend as well.
- **Actual Result:** : No editing button shows up if users are on another users profile meaning that this test case passes and this feature works as it should.

---

### Test Case 2.5 – Profile Reload Reflects Changes

- **Goal:** Ensure changes persist after saving and page reload.
- **Test Data:**  
  - Display Name: “Persistent Test”
- **Steps:**  
  1. User changes name and saves.  
  2. User refreshes the profile page.
- **Expected Result:** New name appears correctly and is stored in DB.
- **Actual Result:** Data is pulled from the data base and after a reload the data does stay on the profile meaning this test passes.

---

### Environment & Testers (All Profile Tests)

- **Environment:**  
  - `localhost:3000/profile`  
  - PostgreSQL (local Docker DB)

- **Testers:**  
  - TBD, likely Daniel or Matt

---

## Feature 3: Spotify Song Search & Selection (Expanded)

This section tests the integration between the user's profile and the Spotify Web API. Users should be able to search for a track, preview results, select one, and save that selection to their profile.

---

### Test Case 3.1 – Successful Search and Selection

- **Goal:** User searches for a track, selects it, and saves it to their profile.
- **Test Data:**
  - User: Eve (ID 5)
  - Search Term: `Bohemian Rhapsody`
- **Steps:**
  1. Eve logs in and opens her profile page.
  2. She opens the Edit Profile modal.
  3. She enters "Bohemian Rhapsody" into the Spotify search bar.
  4. She clicks “Use this song” on one of the results.
  5. She saves the profile.
  6. She sees a Spotify player embedded on the page showing the chosen song.
- **Expected Result:** Track ID is saved in the database and reloaded properly on refresh.
- **Actual Result:** : User is able to search, sleclect, and save a track. Meaning this test passes.

---

### Test Case 3.2 – Empty Search

- **Goal:** The app should not return results when the search input is empty or too short.
- **Test Data:** 
  - Input: Empty string or less than 3 characters
- **Steps:**
  1. User opens the Edit Profile modal.
  2. Leaves the search input blank or types just one letter.
- **Expected Result:** No API call is made, results div remains empty, and no error is thrown.
- **Actual Result:** : There are no results when the user has not entered any value in the search bar for the song, so this test passes.

---

### Test Case 3.3 – Search With No Results

- **Goal:** The user searches for a nonsense term that returns no results.
- **Test Data:**
  - Input: `asdfghjkllzxcv`
- **Steps:**
  1. User enters the nonsense term into the Spotify search bar.
- **Expected Result:** A “no results found” message is shown or results remain empty without error.
- **Actual Result:** : stuff will show up but this is out of our control as it depends on whats listed in spotifys database.

---

### Test Case 3.4 – Song Selected But Modal Not Submitted

- **Goal:** Ensure the song selection does not persist unless the form is submitted.
- **Test Data:**
  - Select any track
- **Steps:**
  1. User opens the modal and selects a song.
  2. User closes the modal without clicking “Save Changes”.
  3. User refreshes the page.
- **Expected Result:** No song is saved to the profile (Spotify player should not appear).
- **Actual Result:** : The modal must be submitted otherwise the song will not be preserved so this test does pass.

---

### Test Case 3.5 – Edit Existing Song Selection

- **Goal:** The user should be able to change the previously selected track.
- **Test Data:**
  - Initial Track: `track1_id`
  - New Track: `track2_id`
- **Steps:**
  1. User has an existing Spotify song embedded.
  2. Opens Edit Profile modal, searches for a different song, and selects it.
  3. Saves the form.
- **Expected Result:** Spotify iframe updates to the new song after saving.
- **Actual Result:** : The user is able to change their previsouly selected track to any track they choose so this test does pass.

---

### Test Case 3.6 – Profile Load With No Song Selected

- **Goal:** Ensure the profile displays a helpful message if no Spotify song has been chosen.
- **Test Data:**  
  - User with `spotify_song_id` = `null`
- **Steps:**
  1. Load user profile for someone who hasn’t selected a song.
- **Expected Result:** A placeholder message like “No favorite song selected yet.” is shown instead of a broken iframe.
- **Actual Result:** : A message saying no favorite song selected pops up so this test does pass.

---

### Environment & Testers (For All Spotify Tests)

- **Environment:**  
  - `localhost:3000/profile`  
  - `.env` includes valid `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`  
  - Spotify Web API and iframe embedding available
- **Testers:**  
  - TBD, likely Daniel or Matt

---
