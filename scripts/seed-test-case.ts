// Dev helper: create a research session with sample facts and print its id.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const facts = {
  facts:
    "My client received a cheque of Rs 5,00,000 from the opposite party towards repayment of a hand loan. The cheque was presented to the bank on 12 March 2026 and was returned unpaid with the endorsement 'funds insufficient'. A legal notice demanding payment was sent by registered post on 20 March 2026 and was duly served, but no payment has been made till date.",
  parties: "Applicant: Ramesh Patil (payee). Respondent: Sunil Deshmukh (drawer of the cheque).",
  timeline:
    "10 Jan 2026 loan advanced. 05 Mar 2026 cheque issued. 12 Mar 2026 cheque dishonoured. 20 Mar 2026 legal notice sent. 28 Mar 2026 notice served. No payment within 15 days.",
  reliefSought: "Recovery of the cheque amount with interest, and prosecution of the drawer.",
};

const r = await prisma.research.create({
  data: { title: "Cheque dishonour — test", caseFacts: { create: facts } },
});
console.log(r.id);
await prisma.$disconnect();
