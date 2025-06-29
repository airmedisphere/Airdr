import asyncio
from utils.directoryHandler import DRIVE_DATA
from utils.logger import Logger
import mimetypes

logger = Logger(__name__)

class StorageAnalytics:
    def __init__(self):
        self.file_types = {
            'videos': ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.ts', '.ogv', '.m4v', '.flv', '.wmv', '.3gp', '.mpg', '.mpeg'],
            'pdfs': ['.pdf'],
            'images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff', '.tif'],
            'documents': ['.doc', '.docx', '.txt', '.rtf', '.odt', '.pages', '.tex', '.wpd', '.xls', '.xlsx', '.ppt', '.pptx'],
            'audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff'],
            'archive': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
            'code': ['.py', '.js', '.html', '.css', '.cpp', '.c', '.java', '.php', '.rb', '.go', '.rs', '.swift']
        }
    
    def get_file_type_category(self, filename):
        """Get file type category based on extension"""
        extension = filename.lower()
        if '.' in extension:
            extension = extension[extension.rfind('.'):]
        
        for category, extensions in self.file_types.items():
            if extension in extensions:
                return category
        
        return 'others'
    
    def analyze_directory(self, folder, path="/", depth=0):
        """Recursively analyze directory structure"""
        analysis = {
            'total_size': 0,
            'total_files': 0,
            'total_folders': 0,
            'type_breakdown': {
                'videos': {'size': 0, 'count': 0},
                'pdfs': {'size': 0, 'count': 0},
                'images': {'size': 0, 'count': 0},
                'documents': {'size': 0, 'count': 0},
                'audio': {'size': 0, 'count': 0},
                'archive': {'size': 0, 'count': 0},
                'code': {'size': 0, 'count': 0},
                'others': {'size': 0, 'count': 0}
            },
            'folder_breakdown': {},
            'largest_files': [],
            'file_count_by_extension': {},
            'size_by_extension': {}
        }
        
        if not hasattr(folder, 'contents'):
            return analysis
        
        for item_id, item in folder.contents.items():
            if hasattr(item, 'trash') and item.trash:
                continue  # Skip trashed items
                
            if item.type == 'folder':
                analysis['total_folders'] += 1
                folder_path = f"{path.rstrip('/')}/{item.name}"
                
                # Recursively analyze subfolder
                subfolder_analysis = self.analyze_directory(item, folder_path, depth + 1)
                
                # Add subfolder data to current analysis
                analysis['total_size'] += subfolder_analysis['total_size']
                analysis['total_files'] += subfolder_analysis['total_files']
                analysis['total_folders'] += subfolder_analysis['total_folders']
                
                # Merge type breakdowns
                for file_type in analysis['type_breakdown']:
                    analysis['type_breakdown'][file_type]['size'] += subfolder_analysis['type_breakdown'][file_type]['size']
                    analysis['type_breakdown'][file_type]['count'] += subfolder_analysis['type_breakdown'][file_type]['count']
                
                # Store folder breakdown
                analysis['folder_breakdown'][folder_path] = {
                    'size': subfolder_analysis['total_size'],
                    'files': subfolder_analysis['total_files'],
                    'folders': subfolder_analysis['total_folders'],
                    'type_breakdown': subfolder_analysis['type_breakdown']
                }
                
                # Merge largest files
                analysis['largest_files'].extend(subfolder_analysis['largest_files'])
                
                # Merge extension data
                for ext, count in subfolder_analysis['file_count_by_extension'].items():
                    analysis['file_count_by_extension'][ext] = analysis['file_count_by_extension'].get(ext, 0) + count
                
                for ext, size in subfolder_analysis['size_by_extension'].items():
                    analysis['size_by_extension'][ext] = analysis['size_by_extension'].get(ext, 0) + size
                
            elif item.type == 'file':
                analysis['total_files'] += 1
                file_size = getattr(item, 'size', 0)
                analysis['total_size'] += file_size
                
                # Categorize file
                category = self.get_file_type_category(item.name)
                analysis['type_breakdown'][category]['size'] += file_size
                analysis['type_breakdown'][category]['count'] += 1
                
                # Track largest files
                file_info = {
                    'name': item.name,
                    'size': file_size,
                    'path': f"{path.rstrip('/')}/{item.name}",
                    'type': category,
                    'upload_date': getattr(item, 'upload_date', 'Unknown')
                }
                analysis['largest_files'].append(file_info)
                
                # Track by extension
                extension = item.name.lower()
                if '.' in extension:
                    extension = extension[extension.rfind('.'):]
                    analysis['file_count_by_extension'][extension] = analysis['file_count_by_extension'].get(extension, 0) + 1
                    analysis['size_by_extension'][extension] = analysis['size_by_extension'].get(extension, 0) + file_size
        
        # Sort largest files by size (keep top 100)
        analysis['largest_files'].sort(key=lambda x: x['size'], reverse=True)
        analysis['largest_files'] = analysis['largest_files'][:100]
        
        return analysis
    
    def get_storage_summary(self):
        """Get overall storage summary"""
        if not DRIVE_DATA:
            return {
                'total_size': 0,
                'total_files': 0,
                'total_folders': 0,
                'formatted_size': '0 B'
            }
        
        root_folder = DRIVE_DATA.get_directory("/")
        analysis = self.analyze_directory(root_folder)
        
        return {
            'total_size': analysis['total_size'],
            'total_files': analysis['total_files'],
            'total_folders': analysis['total_folders'],
            'formatted_size': self.format_bytes(analysis['total_size'])
        }
    
    def get_detailed_analytics(self):
        """Get detailed storage analytics"""
        if not DRIVE_DATA:
            return self._empty_analytics()
        
        root_folder = DRIVE_DATA.get_directory("/")
        analysis = self.analyze_directory(root_folder)
        
        # Format the data for frontend
        return {
            'summary': {
                'total_size': analysis['total_size'],
                'total_files': analysis['total_files'],
                'total_folders': analysis['total_folders'],
                'formatted_size': self.format_bytes(analysis['total_size'])
            },
            'type_breakdown': {
                category: {
                    'size': data['size'],
                    'count': data['count'],
                    'formatted_size': self.format_bytes(data['size']),
                    'percentage': (data['size'] / analysis['total_size'] * 100) if analysis['total_size'] > 0 else 0
                }
                for category, data in analysis['type_breakdown'].items()
                if data['size'] > 0 or data['count'] > 0
            },
            'folder_breakdown': {
                path: {
                    'size': data['size'],
                    'files': data['files'],
                    'folders': data['folders'],
                    'formatted_size': self.format_bytes(data['size']),
                    'percentage': (data['size'] / analysis['total_size'] * 100) if analysis['total_size'] > 0 else 0
                }
                for path, data in analysis['folder_breakdown'].items()
                if data['size'] > 0
            },
            'largest_files': [
                {
                    **file_info,
                    'formatted_size': self.format_bytes(file_info['size'])
                }
                for file_info in analysis['largest_files'][:50]  # Top 50 largest files
            ],
            'extension_stats': {
                'by_count': sorted([
                    {
                        'extension': ext,
                        'count': count,
                        'size': analysis['size_by_extension'].get(ext, 0),
                        'formatted_size': self.format_bytes(analysis['size_by_extension'].get(ext, 0))
                    }
                    for ext, count in analysis['file_count_by_extension'].items()
                ], key=lambda x: x['count'], reverse=True)[:20],
                'by_size': sorted([
                    {
                        'extension': ext,
                        'size': size,
                        'count': analysis['file_count_by_extension'].get(ext, 0),
                        'formatted_size': self.format_bytes(size)
                    }
                    for ext, size in analysis['size_by_extension'].items()
                ], key=lambda x: x['size'], reverse=True)[:20]
            }
        }
    
    def _empty_analytics(self):
        """Return empty analytics structure"""
        return {
            'summary': {
                'total_size': 0,
                'total_files': 0,
                'total_folders': 0,
                'formatted_size': '0 B'
            },
            'type_breakdown': {},
            'folder_breakdown': {},
            'largest_files': [],
            'extension_stats': {
                'by_count': [],
                'by_size': []
            }
        }
    
    def format_bytes(self, bytes_value):
        """Format bytes to human readable format"""
        if bytes_value == 0:
            return "0 B"
        
        units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
        unit_index = 0
        size = float(bytes_value)
        
        while size >= 1024 and unit_index < len(units) - 1:
            size /= 1024
            unit_index += 1
        
        if unit_index == 0:
            return f"{int(size)} {units[unit_index]}"
        else:
            return f"{size:.2f} {units[unit_index]}"

# Global instance
STORAGE_ANALYTICS = StorageAnalytics()