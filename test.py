import torch
print("CUDA Version:", torch.version.cuda)  
print("CUDA Available:", torch.cuda.is_available())  
print("GPU Name:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No GPU found")
