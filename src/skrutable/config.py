import os.path
import json

def load_config_dict_from_json_file():
	abs_dir = os.path.split(os.path.abspath(__file__))[0]
	settings_file_path = os.path.join(abs_dir, 'config.json')
	config_data = open(settings_file_path, 'r', encoding='utf8').read()
	config = json.loads(config_data)
	return config
