import os
import base64
import re
import html
from dotenv import load_dotenv
from atlassian import Confluence
from langchain_core.documents import Document
from ibm_watsonx_orchestrate.agent_builder.tools import tool, ToolPermission
from ibm_watsonx_orchestrate.agent_builder.connections import (
    ConnectionType,
    ExpectedCredentials,
)
from ibm_watsonx_orchestrate.run import connections


def get_confluence_connection():
    """Create and return Confluence connection credentials from orchestrate connections"""
    try:
        # Get credentials from orchestrate connection (required)
        try:
            conn = connections.key_value("confluence_creds")
            confluence_url = conn.get("CONFLUENCE_URL")
            username = conn.get("ATLASSIAN_USERNAME")
            api_token = conn.get("ATLASSIAN_API_TOKEN")
        except Exception as e:
            raise Exception(
                f"Failed to access Confluence connection 'confluence_creds': {str(e)}. Please ensure the connection is properly configured."
            )

        # Validate that we have required credentials
        if not confluence_url:
            raise Exception(
                "CONFLUENCE_URL not found in connection 'confluence_creds'. Please set credentials using setup_connection.sh"
            )
        
        if not username:
            raise Exception(
                "ATLASSIAN_USERNAME not found in connection 'confluence_creds'. Please set credentials using setup_connection.sh"
            )
        
        if not api_token:
            raise Exception(
                "ATLASSIAN_API_TOKEN not found in connection 'confluence_creds'. Please set credentials using setup_connection.sh"
            )

        return {
            "url": confluence_url,
            "username": username,
            "api_token": api_token
        }
    except Exception as e:
        raise Exception(f"Failed to get Confluence connection: {str(e)}")

# --- Confluence Connector Class ---
class ConfluenceConnector:
    def __init__(self, url, username, api_token):
        self.confluence = Confluence(
            url=url,
            username=username,
            password=api_token,
            cloud=True
        )
        
        # Explicitly add Authorization header as requested
        auth_str = f"{username}:{api_token}"
        encoded_auth = base64.b64encode(auth_str.encode()).decode()
        self.confluence.session.headers.update({"Authorization": f"Basic {encoded_auth}"})

    def search_pages(self, query, limit=5, exclude_ids=None):
        """
        Searches for pages in Confluence using CQL (Confluence Query Language).
        Returns a list of LangChain Documents.
        """
        try:
            # Using the simple search API which might be easier for keywords
            # But CQL is more powerful. Let's stick to CQL.
            cql = f'siteSearch ~ "{query}" AND type = "page"'
            
            if exclude_ids:
                ids_str = ", ".join([str(pid) for pid in exclude_ids])
                cql += f' AND id NOT IN ({ids_str})'
                
            results = self.confluence.cql(cql, limit=limit)
            
            documents = []
            for result in results.get('results', []):
                page_id = result['content']['id']
                title = result['content']['title']
                # Fetch full content
                page_content = self.confluence.get_page_by_id(page_id, expand='body.storage')
                body = page_content.get('body', {}).get('storage', {}).get('value', '')
                
                doc = Document(
                    page_content=body,
                    metadata={
                        "title": title,
                        "source": result['content']['_links']['webui'],
                        "page_id": page_id
                    }
                )
                documents.append(doc)
                
            return documents

        except Exception as e:
            print(f"Error searching Confluence: {e}")
            return []

    def get_ticket_page(self, ticket_id):
        """
        Searches for a page containing the ticket_id and returns its details.
        Assumes the page Title is the Summary and Body is the Description.
        """
        try:
            # Search for the page containing the ticket ID
            cql = f'text ~ "{ticket_id}" AND type = "page"'
            results = self.confluence.cql(cql, limit=1)
            
            if not results.get('results'):
                print(f"No page found for ticket ID: {ticket_id}")
                return None
                
            page = results['results'][0]
            page_id = page['content']['id']
            title = page['content']['title']
            
            # Fetch full content
            page_content = self.confluence.get_page_by_id(page_id, expand='body.storage')
            body = page_content.get('body', {}).get('storage', {}).get('value', '')
            
            return {
                "key": ticket_id,
                "summary": title,
                "description": body,
                "page_id": page_id
            }
            
        except Exception as e:
            print(f"Error fetching ticket page for {ticket_id}: {e}")
            return None

    def search_employee_contributor(self, identifier: str, limit: int = 20, context_chars: int = 120):
        """
        Search Confluence pages for occurrences of an employee name or email (identifier).

        Returns a list of dicts with: page_id, title, source, matches (snippets around each occurrence).
        """
        try:
            cql = f'siteSearch ~ "{identifier}" AND type = "page"'
            results = self.confluence.cql(cql, limit=limit)

            matches = []
            search_lower = identifier.lower()

            for result in results.get('results', []):
                page_id = result['content']['id']
                title = result['content']['title']

                page_content = self.confluence.get_page_by_id(page_id, expand='body.storage')
                body = page_content.get('body', {}).get('storage', {}).get('value', '')

                # Strip simple HTML tags for snippet extraction and unescape HTML entities
                text = re.sub(r'<[^>]+>', ' ', body)
                text = html.unescape(text)

                lower = text.lower()
                start = 0
                found_snips = []

                while True:
                    pos = lower.find(search_lower, start)
                    if pos == -1:
                        break
                    s = max(0, pos - context_chars)
                    e = min(len(text), pos + len(identifier) + context_chars)
                    snippet = text[s:e].strip()
                    found_snips.append(snippet)
                    start = pos + len(identifier)

                if found_snips:
                    matches.append({
                        "page_id": page_id,
                        "title": title,
                        "source": result['content']['_links']['webui'],
                        "matches": found_snips,
                    })

            return matches

        except Exception as e:
            print(f"Error searching for contributor {identifier}: {e}")
            return []

# --- Helper Function ---
def get_ticket_context(ticket_id: str) -> str:
    """
    Retrieves context for a given ticket ID from Confluence.
    Returns a formatted string with the ticket details and relevant page excerpts.
    """
    try:
        creds = get_confluence_connection()
    except Exception as e:
        return f"Error: {str(e)}"

    # 1. Fetch Ticket Details
    # Initialize Confluence Connector
    confluence = ConfluenceConnector(creds["url"], creds["username"], creds["api_token"])
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

# --- Tool Definitions ---
@tool(
    name="confluence_search_pages",
    description="Searches for pages in Confluence using CQL (Confluence Query Language)",
    permission=ToolPermission.READ_ONLY,
    expected_credentials=[
        ExpectedCredentials(app_id="confluence_creds", type=ConnectionType.KEY_VALUE)
    ],
)
def confluence_search_pages(query: str, limit: int = 5) -> str:
    """
    Searches for pages in Confluence using CQL (Confluence Query Language).
    
    Args:
        query: The search query to find relevant pages.
        limit: Maximum number of pages to return (default: 5).
        
    Returns:
        A formatted string with page titles, links, and content excerpts.
    """
    try:
        creds = get_confluence_connection()
    except Exception as e:
        return f"Error: {str(e)}"
    
    confluence = ConfluenceConnector(creds["url"], creds["username"], creds["api_token"])
    docs = confluence.search_pages(query, limit=limit)
    
    if not docs:
        return f"No pages found matching query: {query}"
    
    output = []
    output.append(f"Found {len(docs)} page(s) matching '{query}':\n")
    
    for i, doc in enumerate(docs, 1):
        output.append(f"{i}. **{doc.metadata['title']}**")
        output.append(f"   Link: {doc.metadata['source']}")
        output.append(f"   Page ID: {doc.metadata['page_id']}")
        
        # Show content preview (first 300 chars)
        content_preview = doc.page_content[:300] + "..." if len(doc.page_content) > 300 else doc.page_content
        output.append(f"   Preview: {content_preview}")
        output.append("")
    
    return "\n".join(output)


@tool(
    name="confluence_get_ticket_page",
    description="Retrieves a specific Confluence page by ticket ID",
    permission=ToolPermission.READ_ONLY,
    expected_credentials=[
        ExpectedCredentials(app_id="confluence_creds", type=ConnectionType.KEY_VALUE)
    ],
)
def confluence_get_ticket_page(ticket_id: str) -> str:
    """
    Retrieves a specific Confluence page by ticket ID.
    
    Args:
        ticket_id: The ID of the ticket to retrieve (e.g., PROJ-123, NB_0001).
        
    Returns:
        A formatted string with the ticket page details including title and description.
    """
    try:
        creds = get_confluence_connection()
    except Exception as e:
        return f"Error: {str(e)}"
    
    confluence = ConfluenceConnector(creds["url"], creds["username"], creds["api_token"])
    ticket = confluence.get_ticket_page(ticket_id)
    
    if not ticket:
        return f"No page found for ticket ID: {ticket_id}"
    
    output = []
    output.append(f"**Ticket ID:** {ticket['key']}")
    output.append(f"**Summary (Title):** {ticket['summary']}")
    output.append(f"**Page ID:** {ticket['page_id']}")
    output.append(f"\n**Description:**")
    
    # Show full description or truncate if too long
    description = ticket['description']
    if len(description) > 1000:
        output.append(description[:1000] + "...\n[Content truncated]")
    else:
        output.append(description)
    
    return "\n".join(output)


@tool(
    name="confluence_ticket_lookup",
    description="Retrieves context and relevant documentation for a given ticket ID from Confluence",
    permission=ToolPermission.READ_ONLY,
    expected_credentials=[
        ExpectedCredentials(app_id="confluence_creds", type=ConnectionType.KEY_VALUE)
    ],
)
def confluence_ticket_lookup(ticket_id: str) -> str:
    """
    Retrieves context and relevant documentation for a given ticket ID from Confluence.
    
    Args:
        ticket_id: The ID of the ticket to look up (e.g., NB_0001).
        
    Returns:
        A string containing the ticket summary and excerpts from relevant Confluence pages.
    """
    return get_ticket_context(ticket_id)


@tool(
    name="confluence_search_contributor",
    description="Searches Confluence pages for an employee contributor by name or email",
    permission=ToolPermission.READ_ONLY,
    expected_credentials=[
        ExpectedCredentials(app_id="confluence_creds", type=ConnectionType.KEY_VALUE)
    ],
)
def confluence_search_contributor(identifier: str, limit: int = 20) -> str:
    """
    Searches Confluence for occurrences of an employee name or email and returns a formatted
    summary with page titles, links, and content snippets where the identifier appears.
    """
    try:
        creds = get_confluence_connection()
    except Exception as e:
        return f"Error: {str(e)}"

    confluence = ConfluenceConnector(creds["url"], creds["username"], creds["api_token"])
    results = confluence.search_employee_contributor(identifier, limit=limit)

    if not results:
        return f"No contributor matches found for '{identifier}'"

    output = []
    output.append(f"Found matches for '{identifier}':")
    for r in results:
        output.append(f"- {r['title']} ({r['source']})")
        for snip in r['matches'][:3]:
            preview = snip if len(snip) <= 500 else snip[:500] + "..."
            output.append(f"    • {preview}")

    return "\n".join(output)
