import addressRepository, { CreateAddressDTO } from '../repositories/address.repository.js';
import { ApiError } from '../utils/apiError.js';

export class AddressService {
  async getUserAddresses(userId: string) {
    return addressRepository.findByUserId(userId);
  }

  async getAddressById(id: string, userId: string) {
    const address = await addressRepository.findById(id, userId);
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }
    return address;
  }

  async createAddress(data: any) {
    const payload = {
      ...data,
      deliveryNotes: data.deliveryNotes || data.deliveryInstructions,
    };
    delete payload.deliveryInstructions;
    return addressRepository.create(payload);
  }

  async updateAddress(id: string, userId: string, data: any) {
    await this.getAddressById(id, userId);
    const payload = {
      ...data,
      ...(data.deliveryInstructions !== undefined && {
        deliveryNotes: data.deliveryInstructions,
      }),
    };
    delete payload.deliveryInstructions;
    return addressRepository.update(id, userId, payload);
  }

  async deleteAddress(id: string, userId: string) {
    await this.getAddressById(id, userId);
    return addressRepository.delete(id, userId);
  }

  async setDefaultAddress(id: string, userId: string) {
    await this.getAddressById(id, userId);
    return addressRepository.setDefault(id, userId);
  }
}

export const addressService = new AddressService();
export default addressService;
