# BulkScan — calorie scanner & weight-gain tracker

Expo / React Native app (Android-first). Snap your plate → AI lists each item with grams and calories → adjust → log.
Built around gaining weight: surplus target, protein target, calibration from your real weight trend, reminders and "close the gap" suggestions.

## Features
- **🍳 Recipe builder**: weigh raw ingredients + the finished pot → exact kcal per 100 g of *your* cooking. Saved recipes are fed to the photo AI so it uses your real numbers.
- **📷 Plate scan** (Google Gemini free tier by default; Claude optional): itemised grams + kcal/protein/carbs/fat, confidence level, likely gram range, hidden-oil handling, up to 3 photo angles, a text box for things the camera can't see, and **follow-up questions** ("Was it fried?") that re-run the estimate.
- **⚖️ Weighed mode**: type the grams from a kitchen scale for exact numbers.
- **▦ Barcode scan** via Open Food Facts (label-exact). Unknown local products: enter the label once, remembered forever.
- **🔎 Search**: 50+ built-in Filipino foods (rice by the cup, adobo, sinigang, tapsilog parts, pancit, street food…), your saved meals, and packaged products online.
- **★ My Foods**: save a home-cooked plate once, re-log in one tap. "Eat it again" chips for recent foods.
- **🎯 Weight-gain targets**: Mifflin–St Jeor + activity + surplus for 0.25 / 0.35 / 0.5 kg per week; 1.8 g protein/kg.
- **📈 Calibration**: after ~2 weeks it compares logged calories with your actual weight change and back-calculates your real maintenance. This cancels any consistent photo-estimate error.
- **Progress**: weigh-ins, 7-day average trend, pace check, goal ETA, 7-day calorie chart, logging streak.
- **Reminders**: weigh-in, meals, merienda, and an evening nudge with the exact kcal you still need.
- **Backup**: export and restore your data.

## Setup
1. Make a GitHub repo (e.g. `rentschlerm/bulkscan`) and push this folder.
2. GitHub Actions (`.github/workflows/build-apk.yml`) builds the APK on every push to `main` and attaches it to a Release. Download it on your phone and install it.
3. In the app: fill in your profile → Settings → AI scanning → paste a free Gemini key from aistudio.google.com/apikey (Google account, no card).

Local dev: `npm install && npx expo install --fix && npx expo start` (open in Expo Go or a dev build).

`npx expo install --fix` lines up package versions with whatever Expo SDK is current. The workflow runs it too.

## Accuracy, honestly
No photo method gets close to 100%: hidden oil, what's under the rice, and recipe differences make ±10–20% normal even for dietitians.
BulkScan gets as close as it can in four ways:
1. Barcode and weighed entries are exact.
2. Photo scans use scale references (plate size, utensils), several angles, your notes, and follow-up questions.
3. Saved meals keep things consistent: the same plate always logs the same way.
4. Calibration fixes what's left. For gaining weight, the scale is the final judge.
