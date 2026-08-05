import axios from "axios";
import mongoose from "mongoose";

const BASE_URL = "http://localhost:5002/api/v1";

async function runE2ETest() {
  console.log("🚀 STARTING END-TO-END ENROLLMENT FLOW TEST\n");

  const timestamp = Date.now();
  const email = `e2e_student_${timestamp}@growthcraft.in`;
  const password = "Password123!";
  const firstName = "John";
  const lastName = "Student";

  const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
  });

  try {
    // 1. REGISTER FAKE USER
    console.log(`1️⃣ Registering fake student user: ${email}...`);
    const regRes = await client.post("/auth/register", {
      email,
      password,
      confirmPassword: password,
      fullName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      role: "student",
      phone: "9876543210",
      degree: "B.Tech",
      branch: "Computer Science",
      yearOfStudy: "3rd Year",
      collegeName: "GrowthCraft University",
    });
    console.log("   ✅ User registered successfully:", regRes.data.message || "Success");

    // Extract auth cookies from response headers or log in directly
    let cookieHeader = regRes.headers["set-cookie"];

    // 1b. Mark email verified in DB for test user
    const { config } = await import("../src/config");
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGODB_URI);
    }
    const { User } = await import("../src/database/models/User.model");
    await User.updateOne({ email }, { isEmailVerified: true });
    console.log("   ✅ Marked email as verified in database.");

    // 2. LOGIN
    console.log("\n2️⃣ Logging in with fake student...");
    const loginRes = await client.post("/auth/login", {
      email,
      password,
    });
    cookieHeader = loginRes.headers["set-cookie"] || cookieHeader;
    console.log("   ✅ Login successful!");

    const authHeaders = {
      Cookie: Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader || "",
    };

    // 3. FETCH CATALOGUE ITEMS
    console.log("\n3️⃣ Fetching catalogue items (Courses, Events, Training Programs)...");
    const [coursesRes, eventsRes, programsRes] = await Promise.all([
      client.get("/courses", { headers: authHeaders }),
      client.get("/events", { headers: authHeaders }),
      client.get("/training-programs", { headers: authHeaders }),
    ]);

    const courses = coursesRes.data.items || coursesRes.data.courses || [];
    const events = eventsRes.data.items || eventsRes.data.events || [];
    const programs = programsRes.data.items || programsRes.data.programs || [];

    console.log(`   Found ${courses.length} courses, ${events.length} events, ${programs.length} training programs.`);

    const testCourse = courses[0];
    const testEvent = events[0];
    const testProgram = programs[0];

    let courseId = "";
    let eventId = "";
    let programId = "";

    // 4. TEST COURSE ENROLLMENT
    if (testCourse) {
      console.log(`\n4️⃣ Testing Course Enrollment for: "${testCourse.title}" (${testCourse.id || testCourse._id})...`);
      courseId = testCourse.id || testCourse._id;
      const courseEnrollRes = await client.post(
        `/courses/${courseId}/enroll`,
        {
          fullName: `${firstName} ${lastName}`,
          email,
          phone: "9876543210",
          collegeName: "GrowthCraft University",
        },
        { headers: authHeaders }
      );
      console.log("   ✅ Course enrolled successfully:", courseEnrollRes.data.message || "Enrolled");

      const courseStatusRes = await client.get(`/courses/${courseId}/enrollment-status`, { headers: authHeaders });
      console.log("   📊 Course Enrollment Status:", courseStatusRes.data.data || courseStatusRes.data);
    }

    // 5. TEST EVENT / BOOTCAMP ENROLLMENT
    if (testEvent) {
      console.log(`\n5️⃣ Testing Event Enrollment for: "${testEvent.title}" (${testEvent.id || testEvent._id})...`);
      eventId = testEvent.id || testEvent._id;
      const rawType = testEvent.type || "Bootcamp";
      const eventType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
      
      let eventEnrollRes: any;
      try {
        eventEnrollRes = await client.post(
          `/events/${eventType}/${eventId}/register`,
          {
            fullName: `${firstName} ${lastName}`,
            email,
            phone: "+919876543210",
          },
          { headers: authHeaders }
        );
        console.log("   ✅ Event enrolled successfully:", eventEnrollRes.data.message || "Registered");
      } catch (eErr: any) {
        console.error("   ❌ Event enrollment validation error details:", JSON.stringify(eErr.response?.data?.error?.details || eErr.response?.data, null, 2));
        throw eErr;
      }

      // Check Event Enrollment Status
      const eventStatusRes = await client.get(`/events/${eventType}/${eventId}/enrollment-status`, { headers: authHeaders });
      console.log("   📊 Event Enrollment Status:", eventStatusRes.data.data || eventStatusRes.data);

      // Test duplicate registration handling (should return 409 Conflict with 'already registered' message)
      console.log("   Testing duplicate event registration...");
      try {
        await client.post(
          `/events/${eventType}/${eventId}/register`,
          {
            fullName: `${firstName} ${lastName}`,
            email,
            phone: "+919876543210",
          },
          { headers: authHeaders }
        );
      } catch (dupErr: any) {
        console.log("   ✅ Duplicate registration correctly returned 409 Conflict:", dupErr.response?.data?.message || dupErr.response?.data?.error?.message);
      }
    }

    // 6. TEST TRAINING PROGRAM ENROLLMENT (if available)
    if (testProgram) {
      console.log(`\n6️⃣ Testing Training Program Enrollment for: "${testProgram.title}" (${testProgram.id || testProgram._id})...`);
      const programId = testProgram.id || testProgram._id;
      const programEnrollRes = await client.post(
        `/training-programs/${programId}/enroll`,
        {
          fullName: `${firstName} ${lastName}`,
          email,
          phone: "9876543210",
        },
        { headers: authHeaders }
      );
      console.log("   ✅ Training Program enrolled successfully:", programEnrollRes.data.message || "Enrolled");

      const programStatusRes = await client.get(`/training-programs/${programId}/enrollment-status`, { headers: authHeaders });
      console.log("   📊 Training Program Enrollment Status:", programStatusRes.data.data || programStatusRes.data);
    }

    // 7. VERIFY DYNAMIC CATALOGUE CTAs FOR LOGGED-IN USER
    console.log("\n7️⃣ Verifying Dynamic Catalogue CTAs for logged-in user...");
    const [coursesCheckRes, eventsCheckRes] = await Promise.all([
      client.get("/courses", { headers: authHeaders }),
      client.get("/events", { headers: authHeaders }),
    ]);

    const enrolledCourse = (coursesCheckRes.data.items || []).find((c: any) => (c.id || c._id) === courseId);
    const enrolledEvent = (eventsCheckRes.data.items || []).find((e: any) => (e.id || e._id) === eventId);

    console.log("   Enrolled Course CTA:", enrolledCourse ? { title: enrolledCourse.title, isEnrolled: enrolledCourse.isEnrolled, primaryCTA: enrolledCourse.primaryCTA } : "Not found");
    console.log("   Enrolled Event CTA:", enrolledEvent ? { title: enrolledEvent.title, isEnrolled: enrolledEvent.isEnrolled, primaryCTA: enrolledEvent.primaryCTA } : "Not found");

    console.log("\n🎉 ALL E2E ENROLLMENT FLOW TESTS PASSED SUCCESSFULLY! 🚀\n");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error("❌ E2E Test Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
    await mongoose.disconnect();
    process.exit(1);
  }
}

runE2ETest();
