import os
from atlassian import Confluence
from langchain_core.documents import Document

class ConfluenceConnector:
    def __init__(self, url, username, api_token):
        self.confluence = Confluence(
            url=url,
            username=username,
            password=api_token,
            cloud=True
        )
        
        # Explicitly add Authorization header as requested
        import base64
        auth_str = f"{username}:{api_token}"
        encoded_auth = base64.b64encode(auth_str.encode()).decode()
        self.confluence.session.headers.update({"Authorization": f"Basic {encoded_auth}"})

    def search_pages(self, query, limit=5, exclude_ids=None):
        """
        Searches for pages in Confluence using CQL (Confluence Query Language).
        Returns a list of LangChain Documents.
        """
        try:
            # Simple search for now. We can enhance this with CQL.
            # cql = f'text ~ "{query}"'
            # results = self.confluence.cql(cql, limit=limit)
            
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
                
                # Simple HTML cleanup could go here, or we leave it for the RAG pipeline
                
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
