import React from "react";
import { LinkPreview, extractUrl } from "./LinkPreview";
import { CodeBlock } from "./CodeBlock";
import { MindMapViewer } from "./MindMapViewer";
import { InstagramGridPlanner } from "./InstagramGridPlanner";
import { ExpenseChartWidget } from "./ExpenseChartWidget";
import { VoiceNoteSummaryWidget } from "./VoiceNoteSummaryWidget";
import { StoryPollWidget } from "./StoryPollWidget";
import { DMGhostwriterWidget } from "./DMGhostwriterWidget";
import { SkillCourseWidget } from "./SkillCourseWidget";
import { FactCheckWidget } from "./FactCheckWidget";
import { WorkoutWidget } from "./WorkoutWidget";
import { MealPlannerWidget } from "./MealPlannerWidget";
import { CodeAuditWidget } from "./CodeAuditWidget";
import { TravelPlannerWidget } from "./TravelPlannerWidget";
import { ResumeOptimizerWidget } from "./ResumeOptimizerWidget";
import { MeetingNotesWidget } from "./MeetingNotesWidget";
import { VocabBuilderWidget } from "./VocabBuilderWidget";
import { ContractAnalyzerWidget } from "./ContractAnalyzerWidget";
import { TechStackEstimatorWidget } from "./TechStackEstimatorWidget";
import { InterviewPrepWidget } from "./InterviewPrepWidget";
import { PRReviewerWidget } from "./PRReviewerWidget";
import { SqlBuilderWidget } from "./SqlBuilderWidget";
import { PortfolioRebalancerWidget } from "./PortfolioRebalancerWidget";
import { RoadmapPlannerWidget } from "./RoadmapPlannerWidget";
import { SupportTicketWidget } from "./SupportTicketWidget";
import { PaperSummarizerWidget } from "./PaperSummarizerWidget";
import { InvoiceWidget } from "./InvoiceWidget";

// Helper: Format Date Labels for Inline Dividers & Sticky Floating Badge
export const getMessageDateLabel = (dateString: string): string => {
  if (!dateString) return "";
  const messageDate = new Date(dateString);
  const now = new Date();

  const msgZero = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate(),
  );
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = nowZero.getTime() - msgZero.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return messageDate.toLocaleDateString([], { weekday: "long" });
  }

  const day = String(messageDate.getDate()).padStart(2, "0");
  const month = String(messageDate.getMonth() + 1).padStart(2, "0");
  const year = messageDate.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper: Render Message Content with Code Blocks & WebAssembly Code Interpreter & Mind Maps
export const renderMessageTextWithCodeBlocks = (text: string) => {
  if (!text) return null;
  const codeBlockRegex = /```([a-zA-Z0-9_\s-]*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex, match.index),
      });
    }

    parts.push({
      type: "code",
      language: (match[1] || "python").trim(),
      content: match[2],
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.substring(lastIndex),
    });
  }

  if (parts.length === 0) {
    return <p className="leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  return (
    <div className="space-y-2">
      {parts.map((part, idx) => {
        if (part.type === "code") {
          const langLower = part.language.toLowerCase();
          if (
            langLower.includes("paper-summarizer") ||
            langLower.includes("papersummarizer") ||
            langLower.includes("paper-summary")
          ) {
            try {
              const paperData = JSON.parse(part.content.trim());
              if (
                paperData &&
                (paperData.title || Array.isArray(paperData.keyFindings))
              ) {
                return <PaperSummarizerWidget key={idx} data={paperData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse paper-summarizer JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("invoice-generator") ||
            langLower.includes("invoicegenerator") ||
            langLower.includes("invoice")
          ) {
            try {
              const invoiceData = JSON.parse(part.content.trim());
              if (
                invoiceData &&
                (invoiceData.invoiceNumber ||
                  invoiceData.clientName ||
                  Array.isArray(invoiceData.items))
              ) {
                return <InvoiceWidget key={idx} invoice={invoiceData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse invoice-generator JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("sql-builder") ||
            langLower.includes("sqlbuilder")
          ) {
            try {
              const sqlData = JSON.parse(part.content.trim());
              if (sqlData && (sqlData.queryName || sqlData.sql)) {
                return <SqlBuilderWidget key={idx} query={sqlData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse sql-builder JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("portfolio-rebalancer") ||
            langLower.includes("portfoliorebalancer")
          ) {
            try {
              const portfolioData = JSON.parse(part.content.trim());
              if (
                portfolioData &&
                (portfolioData.portfolioName ||
                  Array.isArray(portfolioData.items))
              ) {
                return (
                  <PortfolioRebalancerWidget
                    key={idx}
                    portfolio={portfolioData}
                  />
                );
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse portfolio-rebalancer JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("roadmap-planner") ||
            langLower.includes("roadmapplanner")
          ) {
            try {
              const roadmapData = JSON.parse(part.content.trim());
              if (
                roadmapData &&
                (roadmapData.projectName || Array.isArray(roadmapData.items))
              ) {
                return <RoadmapPlannerWidget key={idx} data={roadmapData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse roadmap-planner JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("support-ticket") ||
            langLower.includes("supportticket")
          ) {
            try {
              const ticketData = JSON.parse(part.content.trim());
              if (
                ticketData &&
                (ticketData.ticketId || ticketData.customerName)
              ) {
                return <SupportTicketWidget key={idx} ticket={ticketData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse support-ticket JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("interview-prep") ||
            langLower.includes("interviewprep")
          ) {
            try {
              const prepData = JSON.parse(part.content.trim());
              if (
                prepData &&
                (prepData.targetRole || Array.isArray(prepData.questions))
              ) {
                return <InterviewPrepWidget key={idx} prep={prepData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse interview-prep JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("pr-reviewer") ||
            langLower.includes("prreviewer") ||
            langLower.includes("pr-review")
          ) {
            try {
              const reviewData = JSON.parse(part.content.trim());
              if (
                reviewData &&
                (reviewData.prTitle || Array.isArray(reviewData.files))
              ) {
                return <PRReviewerWidget key={idx} review={reviewData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse pr-reviewer JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("contract-analyzer") ||
            langLower.includes("contractanalyzer")
          ) {
            try {
              const analysisData = JSON.parse(part.content.trim());
              if (
                analysisData &&
                (analysisData.documentTitle ||
                  Array.isArray(analysisData.risks))
              ) {
                return (
                  <ContractAnalyzerWidget key={idx} analysis={analysisData} />
                );
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse contract-analyzer JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("techstack-estimator") ||
            langLower.includes("techstackestimator") ||
            langLower.includes("tech-stack")
          ) {
            try {
              const estimateData = JSON.parse(part.content.trim());
              if (
                estimateData &&
                (estimateData.projectName ||
                  Array.isArray(estimateData.breakdown))
              ) {
                return (
                  <TechStackEstimatorWidget key={idx} estimate={estimateData} />
                );
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse techstack-estimator JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("meeting-notes") ||
            langLower.includes("meetingnotes")
          ) {
            try {
              const notesData = JSON.parse(part.content.trim());
              if (
                notesData &&
                (notesData.title || Array.isArray(notesData.actionItems))
              ) {
                return <MeetingNotesWidget key={idx} notes={notesData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse meeting-notes JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("vocab-builder") ||
            langLower.includes("vocabbuilder")
          ) {
            try {
              const vocabData = JSON.parse(part.content.trim());
              if (
                vocabData &&
                (vocabData.targetLanguage || Array.isArray(vocabData.words))
              ) {
                return <VocabBuilderWidget key={idx} data={vocabData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse vocab-builder JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("travel-plan") ||
            langLower.includes("travelplan")
          ) {
            try {
              const travelData = JSON.parse(part.content.trim());
              if (
                travelData &&
                (travelData.destination || Array.isArray(travelData.days))
              ) {
                return <TravelPlannerWidget key={idx} plan={travelData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse travel-plan JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("resume-optimize") ||
            langLower.includes("resumeoptimize")
          ) {
            try {
              const resumeData = JSON.parse(part.content.trim());
              if (
                resumeData &&
                (resumeData.jobTitle ||
                  Array.isArray(resumeData.missingKeywords))
              ) {
                return <ResumeOptimizerWidget key={idx} data={resumeData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse resume-optimize JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("meal-plan") ||
            langLower.includes("mealplan")
          ) {
            try {
              const mealData = JSON.parse(part.content.trim());
              if (
                mealData &&
                (mealData.dayTitle || Array.isArray(mealData.meals))
              ) {
                return <MealPlannerWidget key={idx} plan={mealData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse meal-plan JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("code-audit") ||
            langLower.includes("codeaudit")
          ) {
            try {
              const auditData = JSON.parse(part.content.trim());
              if (auditData && Array.isArray(auditData.issues)) {
                return <CodeAuditWidget key={idx} audit={auditData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse code-audit JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("workout-plan") ||
            langLower.includes("workoutplan")
          ) {
            try {
              const planData = JSON.parse(part.content.trim());
              if (
                planData &&
                (planData.title || Array.isArray(planData.exercises))
              ) {
                return <WorkoutWidget key={idx} plan={planData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse workout-plan JSON:",
                e,
              );
            }
          }
          if (
            langLower.includes("fact-check") ||
            langLower.includes("factcheck")
          ) {
            try {
              const factData = JSON.parse(part.content.trim());
              if (factData && factData.claim) {
                return <FactCheckWidget key={idx} fact={factData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse fact-check JSON:",
                e,
              );
            }
          }
          if (langLower.includes("dm-ghostwriter")) {
            try {
              const ghostwriterData = JSON.parse(part.content.trim());
              if (ghostwriterData && Array.isArray(ghostwriterData.replies)) {
                return <DMGhostwriterWidget key={idx} data={ghostwriterData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse dm-ghostwriter JSON:",
                e,
              );
            }
          }
          if (langLower.includes("skill-course")) {
            try {
              const courseData = JSON.parse(part.content.trim());
              if (courseData && courseData.courseTitle) {
                return <SkillCourseWidget key={idx} course={courseData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse skill-course JSON:",
                e,
              );
            }
          }
          if (langLower.includes("voice-summary")) {
            try {
              const voiceData = JSON.parse(part.content.trim());
              if (voiceData && Array.isArray(voiceData.bulletSummary)) {
                return <VoiceNoteSummaryWidget key={idx} summary={voiceData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse voice summary JSON:",
                e,
              );
            }
          }
          if (langLower.includes("story-poll")) {
            try {
              const pollData = JSON.parse(part.content.trim());
              if (pollData && pollData.question) {
                return <StoryPollWidget key={idx} poll={pollData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse story poll JSON:",
                e,
              );
            }
          }
          if (langLower.includes("expense-log")) {
            try {
              const expenseData = JSON.parse(part.content.trim());
              if (
                expenseData &&
                expenseData.total !== undefined &&
                Array.isArray(expenseData.items)
              ) {
                return <ExpenseChartWidget key={idx} summary={expenseData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse expense JSON:",
                e,
              );
            }
          }
          if (langLower.includes("ig-grid")) {
            try {
              const postsData = JSON.parse(part.content.trim());
              if (Array.isArray(postsData)) {
                return <InstagramGridPlanner key={idx} posts={postsData} />;
              }
            } catch (e) {
              console.error(
                "[MessageContentRenderer] Failed to parse ig-grid JSON:",
                e,
              );
            }
          }
          if (
            langLower.startsWith("mermaid") ||
            part.content.trim().startsWith("mindmap") ||
            part.content.trim().startsWith("graph")
          ) {
            return <MindMapViewer key={idx} chartDefinition={part.content} />;
          }
          return (
            <CodeBlock key={idx} code={part.content} language={part.language} />
          );
        }
        const url = extractUrl(part.content);
        if (url) {
          return (
            <div key={idx} className="space-y-1.5">
              <LinkPreview url={url} hero />
              <p className="leading-relaxed whitespace-pre-wrap">
                {part.content}
              </p>
            </div>
          );
        }
        return (
          <p key={idx} className="leading-relaxed whitespace-pre-wrap">
            {part.content}
          </p>
        );
      })}
    </div>
  );
};
