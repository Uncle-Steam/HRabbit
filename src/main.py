import os
import argparse
from dotenv import load_dotenv

from src.connectors.confluence_loader import ConfluenceConnector
from src.rag.chain import RAGChain

def get_ticket_context(ticket_id: str) -> str:
    """
    Retrieves context for a given ticket ID from Confluence.
    Returns a formatted string with the ticket details and relevant page excerpts.
    """
    load_dotenv()
    
    confluence_url = os.getenv("CONFLUENCE_URL")
    username = os.getenv("ATLASSIAN_USERNAME")
    api_token = os.getenv("ATLASSIAN_API_TOKEN")
    
    if not all([confluence_url, username, api_token]):
        return "Error: Missing environment variables. Please check .env file."

    # 1. Fetch Ticket Details
    # Initialize Confluence Connector
    confluence = ConfluenceConnector(confluence_url, username, api_token)
    ticket = confluence.get_ticket_page(ticket_id)
    
    if not ticket:
        return f"Failed to fetch ticket details for {ticket_id} from Confluence."
        
    output = []
    output.append(f"Ticket Summary (Page Title): {ticket['summary']}")
    
    # 2. Formulate Search Query
    search_query = ticket_id
    output.append(f"Searching Confluence for: {search_query}")
    
    # 3. Search Confluence
    docs = confluence.search_pages(search_query)
    
    # Filter: Ensure Ticket ID is actually in the content (Strict Check)
    filtered_docs = []
    for doc in docs:
        if ticket_id in doc.page_content:
            filtered_docs.append(doc)
            
    docs = filtered_docs
    
    output.append(f"Found {len(docs)} relevant pages matching {ticket_id}.")
    for doc in docs:
        output.append(f" - {doc.metadata['title']} ({doc.metadata['source']})")
    
    # Alternative: Show Extracted Output
    output.append("\n=== Extracted Content ===\n")
    for i, doc in enumerate(docs):
        output.append(f"--- Document {i+1}: {doc.metadata['title']} ---")
        # Limit content length for readability in output
        content_preview = doc.page_content[:500] + "..." if len(doc.page_content) > 500 else doc.page_content
        output.append(content_preview)
        output.append("\n")
    output.append("=========================")
    
    return "\n".join(output)

def main():
    parser = argparse.ArgumentParser(description="Jira-Confluence RAG System")
    parser.add_argument("--ticket", required=True, help="Confluence Ticket ID (e.g., NB_0001)")
    parser.add_argument("--query", help="Optional user query. (Not used in current extraction mode)")
    
    args = parser.parse_args()
    
    print(f"Fetching ticket details for {args.ticket} from Confluence...")
    result = get_ticket_context(args.ticket)
    print(result)

if __name__ == "__main__":
    main()
