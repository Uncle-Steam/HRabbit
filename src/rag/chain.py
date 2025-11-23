from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

class RAGChain:
    def __init__(self, model_name="gpt-4o"):
        self.llm = ChatOpenAI(model=model_name, temperature=0)
        self.prompt = ChatPromptTemplate.from_template(
            """You are a helpful assistant assisting a user with a Jira ticket.
            Use the following pieces of retrieved context from Confluence pages to answer the question.
            If you don't know the answer, just say that you don't know.
            
            Context:
            {context}
            
            Ticket Summary: {ticket_summary}
            Ticket Description: {ticket_description}
            
            Question: {question}
            
            Answer:"""
        )
        
    def format_docs(self, docs):
        return "\n\n".join(f"--- Page: {doc.metadata['title']} ---\n{doc.page_content}" for doc in docs)

    def answer(self, query, ticket_details, context_docs):
        """
        Generates an answer based on the query, ticket details, and retrieved documents.
        """
        if not context_docs:
            return "No relevant Confluence pages found to answer this query."

        formatted_context = self.format_docs(context_docs)
        
        chain = (
            self.prompt 
            | self.llm 
            | StrOutputParser()
        )
        
        return chain.invoke({
            "context": formatted_context,
            "ticket_summary": ticket_details.get('summary', ''),
            "ticket_description": ticket_details.get('description', ''),
            "question": query
        })
