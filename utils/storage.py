from utils.directoryHandler import DRIVE_DATA
from utils.logger import Logger

logger = Logger(__name__)

def calculate_total_storage():
    """Calculate total storage used across all files in the drive"""
    if not DRIVE_DATA:
        return 0
    
    total_size = 0
    
    def traverse_directory(folder):
        nonlocal total_size
        for item in folder.contents.values():
            if item.type == "file" and not item.trash:
                total_size += item.size
            elif item.type == "folder" and not item.trash:
                traverse_directory(item)
    
    root_folder = DRIVE_DATA.get_directory("/")
    traverse_directory(root_folder)
    
    return total_size

def get_storage_analytics():
    """Get detailed storage analytics including folder-wise breakdown"""
    if not DRIVE_DATA:
        return {
            "total_storage": 0,
            "total_files": 0,
            "total_folders": 0,
            "folder_breakdown": [],
            "file_type_breakdown": {},
            "largest_files": []
        }
    
    total_size = 0
    total_files = 0
    total_folders = 0
    folder_breakdown = []
    file_type_breakdown = {}
    all_files = []
    
    def analyze_folder(folder, folder_path="/", folder_name="Root"):
        nonlocal total_size, total_files, total_folders
        
        folder_size = 0
        folder_file_count = 0
        folder_subfolder_count = 0
        
        for item in folder.contents.values():
            if item.trash:
                continue
                
            if item.type == "file":
                total_files += 1
                folder_file_count += 1
                total_size += item.size
                folder_size += item.size
                
                # Track file types
                file_ext = item.name.split('.')[-1].lower() if '.' in item.name else 'no extension'
                if file_ext not in file_type_breakdown:
                    file_type_breakdown[file_ext] = {"count": 0, "size": 0}
                file_type_breakdown[file_ext]["count"] += 1
                file_type_breakdown[file_ext]["size"] += item.size
                
                # Add to all files list for largest files tracking
                all_files.append({
                    "name": item.name,
                    "size": item.size,
                    "path": folder_path,
                    "upload_date": item.upload_date
                })
                
            elif item.type == "folder":
                total_folders += 1
                folder_subfolder_count += 1
                subfolder_path = f"{folder_path.rstrip('/')}/{item.id}"
                subfolder_size, _, _ = analyze_folder(item, subfolder_path, item.name)
                folder_size += subfolder_size
        
        # Add folder to breakdown if it has content
        if folder_size > 0 or folder_file_count > 0:
            folder_breakdown.append({
                "name": folder_name,
                "path": folder_path,
                "size": folder_size,
                "file_count": folder_file_count,
                "subfolder_count": folder_subfolder_count
            })
        
        return folder_size, folder_file_count, folder_subfolder_count
    
    root_folder = DRIVE_DATA.get_directory("/")
    analyze_folder(root_folder)
    
    # Sort folder breakdown by size (descending)
    folder_breakdown.sort(key=lambda x: x["size"], reverse=True)
    
    # Get top 10 largest files
    largest_files = sorted(all_files, key=lambda x: x["size"], reverse=True)[:10]
    
    # Sort file type breakdown by size
    file_type_breakdown = dict(sorted(file_type_breakdown.items(), key=lambda x: x[1]["size"], reverse=True))
    
    return {
        "total_storage": total_size,
        "total_files": total_files,
        "total_folders": total_folders,
        "folder_breakdown": folder_breakdown,
        "file_type_breakdown": file_type_breakdown,
        "largest_files": largest_files
    }

def format_bytes(bytes_value):
    """Format bytes to human readable format"""
    if bytes_value == 0:
        return "0 B"
    
    units = ["B", "KB", "MB", "GB", "TB"]
    unit_index = 0
    size = float(bytes_value)
    
    while size >= 1024 and unit_index < len(units) - 1:
        size /= 1024
        unit_index += 1
    
    if unit_index == 0:
        return f"{int(size)} {units[unit_index]}"
    else:
        return f"{size:.2f} {units[unit_index]}"