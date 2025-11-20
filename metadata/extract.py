import json
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from datetime import datetime

# For reverse geocoding (getting city from coordinates)
try:
    from geopy.geocoders import Nominatim
    from geopy.exc import GeocoderTimedOut, GeocoderServiceError
    GEOPY_AVAILABLE = True
except ImportError:
    GEOPY_AVAILABLE = False

def _safe_float_conversion(value):
    """Safely convert a value to float, handling IFDRational and edge cases."""
    try:
        if value is None:
            return None
        if hasattr(value, 'numerator') and hasattr(value, 'denominator'):
            if value.denominator == 0:
                return None
            return float(value.numerator) / float(value.denominator)
        return float(value)
    except:
        return None

def _convert_to_degrees(value):
    """Helper function to convert GPS coordinates to degrees in float format."""
    try:
        if not value or len(value) != 3:
            return None
        
        d = float(value[0]) if hasattr(value[0], 'numerator') else float(value[0]) if value[0] else 0
        m = float(value[1]) if hasattr(value[1], 'numerator') else float(value[1]) if value[1] else 0
        s = float(value[2]) if hasattr(value[2], 'numerator') else float(value[2]) if value[2] else 0
        
        return d + (m / 60.0) + (s / 3600.0)
    except:
        return None

def _get_decimal_coordinates(gps_info):
    """Convert GPS coordinates from degrees/minutes/seconds to decimal format."""
    lat = None
    lon = None
    
    try:
        gps_latitude = gps_info.get('GPSLatitude')
        gps_latitude_ref = gps_info.get('GPSLatitudeRef')
        gps_longitude = gps_info.get('GPSLongitude')
        gps_longitude_ref = gps_info.get('GPSLongitudeRef')
        
        if gps_latitude and gps_latitude_ref and gps_longitude and gps_longitude_ref:
            lat = _convert_to_degrees(gps_latitude)
            if lat is not None and gps_latitude_ref != 'N':
                lat = -lat
            
            lon = _convert_to_degrees(gps_longitude)
            if lon is not None and gps_longitude_ref != 'E':
                lon = -lon
    except:
        pass
    
    return lat, lon

def _get_location_name(latitude, longitude, timeout=10):
    """Get location name from GPS coordinates using reverse geocoding."""
    if not GEOPY_AVAILABLE:
        return None
    
    try:
        geolocator = Nominatim(user_agent="image_metadata_extractor_v1.0")
        location = geolocator.reverse(f"{latitude}, {longitude}", 
                                     exactly_one=True, 
                                     timeout=timeout,
                                     language='en')
        
        if location and location.raw:
            address = location.raw.get('address', {})
            
            location_info = {
                "formatted_address": location.address,
                "city": address.get('city') or 
                       address.get('town') or 
                       address.get('village') or 
                       address.get('municipality') or
                       address.get('suburb'),
                "state": address.get('state') or address.get('province'),
                "country": address.get('country'),
                "country_code": address.get('country_code', '').upper(),
                "postcode": address.get('postcode'),
                "road": address.get('road'),
                "neighbourhood": address.get('neighbourhood') or address.get('suburb')
            }
            
            location_info = {k: v for k, v in location_info.items() if v is not None}
            return location_info
        
        return None
    except:
        return None

def _format_exif_value(value):
    """Format EXIF values to be JSON serializable."""
    try:
        if value is None:
            return None
        
        if hasattr(value, 'numerator') and hasattr(value, 'denominator'):
            if value.denominator == 0:
                return str(value)
            result = _safe_float_conversion(value)
            if result is not None and result.is_integer():
                return int(result)
            return result
        
        if isinstance(value, bytes):
            try:
                return value.decode('utf-8', errors='ignore')
            except:
                return str(value)
        
        if isinstance(value, tuple):
            return [_format_exif_value(v) for v in value]
        
        if isinstance(value, list):
            return [_format_exif_value(v) for v in value]
        
        return value
    except:
        return str(value)

def get_image_metadata(image_input):
    """
    Extract metadata from an image including location and time taken.
    Returns the metadata as a JSON string.
    
    Args:
        image_input (str or file-like object): Path to the image file or file handle
    
    Returns:
        str: JSON string containing image metadata with the following structure:
            - filename: Name of the image file or file handle info
            - image_size: Dictionary with width and height
            - format: Image format (JPEG, PNG, etc.)
            - mode: Color mode (RGB, etc.)
            - location: GPS coordinates and location name (if available)
            - time_taken: Timestamp when photo was taken (if available)
            - Make, Model, ISO, etc.: Camera and photo settings (if available)
    
    Example:
        >>> from extract import get_image_metadata
        >>> # With file path
        >>> json_data = get_image_metadata("photo.jpg")
        >>> 
        >>> # With file handle
        >>> with open("photo.jpg", "rb") as f:
        ...     json_data = get_image_metadata(f)
        >>> 
        >>> # Parse JSON if needed
        >>> import json
        >>> metadata = json.loads(json_data)
        >>> print(metadata['location']['city'])
    """
    try:
        image = Image.open(image_input)
        exif_data = image.getexif()
        
        # Get filename from input
        if hasattr(image_input, 'name'):
            filename = image_input.name
        elif isinstance(image_input, str):
            filename = image_input
        else:
            filename = "file_handle"
            
        metadata = {
            "filename": filename,
            "image_size": {
                "width": image.width,
                "height": image.height
            },
            "format": image.format,
            "mode": image.mode
        }
        
        if not exif_data:
            metadata["warning"] = "No EXIF data found in the image"
            metadata["location"] = "No GPS data available"
            metadata["time_taken"] = "No timestamp available"
            return json.dumps(metadata, indent=2, ensure_ascii=False)
        
        gps_info = {}
        for tag_id, value in exif_data.items():
            try:
                tag_name = TAGS.get(tag_id, tag_id)
                
                if tag_name in ['DateTime', 'DateTimeOriginal', 'DateTimeDigitized']:
                    try:
                        dt = datetime.strptime(str(value), '%Y:%m:%d %H:%M:%S')
                        metadata[tag_name] = dt.isoformat()
                    except:
                        metadata[tag_name] = str(value)
                
                elif tag_name == 'GPSInfo':
                    try:
                        gps_data = exif_data.get_ifd(tag_id)
                        for gps_tag_id in gps_data:
                            gps_tag_name = GPSTAGS.get(gps_tag_id, gps_tag_id)
                            gps_info[gps_tag_name] = gps_data[gps_tag_id]
                    except:
                        pass
                
                elif tag_name in ['Make', 'Model', 'Software', 'Orientation', 
                                  'XResolution', 'YResolution', 'ResolutionUnit',
                                  'Flash', 'FocalLength', 'ExposureTime', 'FNumber',
                                  'ISOSpeedRatings', 'ISO', 'LensModel', 'WhiteBalance',
                                  'ExposureMode', 'ExposureProgram', 'MeteringMode',
                                  'LightSource', 'ColorSpace', 'ExifImageWidth', 'ExifImageHeight']:
                    formatted_value = _format_exif_value(value)
                    if formatted_value is not None:
                        metadata[tag_name] = formatted_value
            except:
                continue
        
        if gps_info:
            try:
                lat, lon = _get_decimal_coordinates(gps_info)
                if lat is not None and lon is not None:
                    metadata['location'] = {
                        "latitude": round(lat, 6),
                        "longitude": round(lon, 6),
                        "latitude_ref": str(gps_info.get('GPSLatitudeRef', '')),
                        "longitude_ref": str(gps_info.get('GPSLongitudeRef', ''))
                    }
                    
                    if 'GPSAltitude' in gps_info:
                        altitude = _safe_float_conversion(gps_info['GPSAltitude'])
                        if altitude is not None:
                            altitude_ref = gps_info.get('GPSAltitudeRef', 0)
                            if altitude_ref == 1:
                                altitude = -altitude
                            metadata['location']['altitude'] = round(altitude, 2)
                    
                    if 'GPSDateStamp' in gps_info and 'GPSTimeStamp' in gps_info:
                        try:
                            gps_date = str(gps_info['GPSDateStamp'])
                            gps_time = gps_info['GPSTimeStamp']
                            hours = _safe_float_conversion(gps_time[0]) or 0
                            minutes = _safe_float_conversion(gps_time[1]) or 0
                            seconds = _safe_float_conversion(gps_time[2]) or 0
                            metadata['location']['gps_timestamp'] = f"{gps_date} {int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"
                        except:
                            pass
                    
                    if GEOPY_AVAILABLE:
                        location_info = _get_location_name(lat, lon)
                        if location_info:
                            metadata['location']['location_name'] = location_info
                    
                else:
                    metadata['location'] = "GPS coordinates could not be parsed"
            except:
                metadata['location'] = "Error parsing GPS data"
        else:
            metadata['location'] = "No GPS data available"
        
        time_taken = metadata.get('DateTimeOriginal') or \
                     metadata.get('DateTimeDigitized') or \
                     metadata.get('DateTime')
        
        metadata['time_taken'] = time_taken if time_taken else "No timestamp available"
        
        return json.dumps(metadata, indent=2, ensure_ascii=False)
        
    except FileNotFoundError:
        filename = image_input if isinstance(image_input, str) else getattr(image_input, 'name', 'file_handle')
        error_data = {"error": f"File not found: {filename}"}
        return json.dumps(error_data, indent=2, ensure_ascii=False)
    except Exception as e:
        error_data = {"error": f"Error processing image: {str(e)}"}
        return json.dumps(error_data, indent=2, ensure_ascii=False)