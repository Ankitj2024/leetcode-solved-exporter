const GRAPHQL_URL = "https://leetcode.com/graphql/";

const GET_USER_PROFILE = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
}`;

const GET_QUESTIONS_LIST = `
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      frontendQuestionId: questionFrontendId
      title
      titleSlug
      difficulty
      status
      paidOnly: isPaidOnly
      topicTags {
        name
      }
    }
  }
}`;

async function fetchGraphQL(query, variables) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

async function fetchAllSolvedQuestions(username) {
  try {
    // 1. Sanity check: get total solved count for progress reporting
    chrome.runtime.sendMessage({ type: 'progress', message: `Fetching profile for ${username}...` });
    
    let profileData = null;
    try {
      profileData = await fetchGraphQL(GET_USER_PROFILE, { username });
    } catch (e) {
      throw new Error("Failed to fetch user profile. Are you logged in?");
    }

    if (!profileData.data || !profileData.data.matchedUser) {
      throw new Error(`User ${username} not found or not logged in.`);
    }

    const submitStats = profileData.data.matchedUser.submitStats.acSubmissionNum;
    const allStats = submitStats.find(s => s.difficulty === "All");
    const targetSolvedCount = allStats ? allStats.count : 0;
    
    if (targetSolvedCount === 0) {
      chrome.runtime.sendMessage({ type: 'complete', message: 'You have 0 solved questions.', data: [] });
      return;
    }

    chrome.runtime.sendMessage({ 
      type: 'progress', 
      message: `Found ${targetSolvedCount} total solved questions. Starting export...` 
    });

    // 2. Fetch all paginated questions
    const limit = 100;
    let skip = 0;
    let hasMore = true;
    let allSolved = [];
    let totalQuestions = 0;
    
    while (hasMore) {
      const variables = { categorySlug: "", skip, limit, filters: {} };
      const res = await fetchGraphQL(GET_QUESTIONS_LIST, variables);
      
      if (!res.data || !res.data.problemsetQuestionList) {
        throw new Error("Failed to fetch questions list. Check your login status.");
      }

      const qList = res.data.problemsetQuestionList;
      totalQuestions = qList.total;
      const questions = qList.questions;
      
      if (questions.length === 0) {
        hasMore = false;
        break;
      }

      // Filter accepted
      const accepted = questions.filter(q => q.status === "ac");
      allSolved.push(...accepted);

      chrome.runtime.sendMessage({ 
        type: 'progress', 
        message: `Fetched ${skip + questions.length} / ${totalQuestions} questions. Found ${allSolved.length} solved.`,
        fetched: skip + questions.length,
        total: totalQuestions
      });

      skip += limit;
      
      if (skip >= totalQuestions || questions.length < limit) {
        hasMore = false;
      } else {
        // Sleep 200ms to avoid rate limits
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log("Export complete! Solved:", allSolved.length);
    chrome.runtime.sendMessage({ 
      type: 'complete', 
      message: `Successfully fetched ${allSolved.length} solved questions!`,
      data: allSolved
    });
    
  } catch (err) {
    console.error("Export error:", err);
    chrome.runtime.sendMessage({ type: 'error', message: err.message || err.toString() });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'start_export') {
    fetchAllSolvedQuestions(request.username);
  }
});
