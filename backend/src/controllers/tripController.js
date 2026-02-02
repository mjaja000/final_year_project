const TripModel = require('../models/tripModel');
const BookingModel = require('../models/bookingModel');

class TripController {
  static async createTrip(req, res) {
    try {
      const { vehicleId, routeId, saccoId, capacity, startTime, origin, destination } = req.body;
      if (!vehicleId || !routeId) return res.status(400).json({ message: 'Missing vehicleId or routeId' });
      const trip = await TripModel.createTrip({ vehicleId, routeId, saccoId, capacity: capacity || undefined, startTime, origin, destination });
      res.status(201).json({ message: 'Trip created', trip });
    } catch (error) {
      console.error('Create trip error:', error.message);
      res.status(500).json({ message: 'Failed to create trip', error: error.message });
    }
  }

  static async getTrip(req, res) {
    try {
      const { id } = req.params;
      const trip = await TripModel.getTripById(id);
      if (!trip) return res.status(404).json({ message: 'Trip not found' });
      res.json({ trip });
    } catch (error) {
      console.error('Get trip error:', error.message);
      res.status(500).json({ message: 'Failed to fetch trip', error: error.message });
    }
  }

  static async listTrips(req, res) {
    try {
      const trips = await TripModel.getAvailableTrips();
      res.json({ total: trips.length, trips });
    } catch (error) {
      console.error('List trips error:', error.message);
      res.status(500).json({ message: 'Failed to list trips', error: error.message });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!id || !status) return res.status(400).json({ message: 'Missing id or status' });
      const trip = await TripModel.updateStatus(id, status);
      // Emit socket event
      const io = req.app.get('io');
      if (io) io.to('admin').emit('trip.updated', trip);
      res.json({ message: 'Trip status updated', trip });
    } catch (error) {
      console.error('Update trip status error:', error.message);
      res.status(500).json({ message: 'Failed to update trip', error: error.message });
    }
  }

  // Create booking from office
  static async createBooking(req, res) {
    try {
      const { tripId, passengerName, phoneNumber, originStop, destinationStop } = req.body;
      if (!tripId || !passengerName || !phoneNumber) return res.status(400).json({ message: 'Missing required booking fields' });

      // Create booking
      const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
      const booking = await BookingModel.createBooking({ tripId, passengerName, phoneNumber, originStop, destinationStop, ticketCode });

      // increment occupancy
      const trip = await TripModel.incrementOccupancy(tripId);

      // Create payment record (office payment) and mark as completed
      const RouteModel = require('../models/routeModel');
      const PaymentModel = require('../models/paymentModel');
      const route = await RouteModel.getRouteById(trip.route_id || trip.routeId);
      const amount = route?.base_fare || 0;

      try {
        const payment = await PaymentModel.initiatePayment(null, trip.route_id || trip.routeId, amount, phoneNumber);
        await PaymentModel.updatePaymentStatus(payment.id, 'completed', ticketCode);
      } catch (payErr) {
        console.warn('Failed to record office payment:', payErr.message);
      }

      // emit socket
      const io = req.app.get('io');
      if (io) io.to('admin').emit('booking.created', { booking, trip });

      // Send ticket via WhatsApp (if configured)
      try {
        const WhatsappService = require('../services/whatsappService');
        await WhatsappService.sendPaymentConfirmation(phoneNumber, { routeName: route?.route_name || `Route ${trip.route_id}`, amount, transactionId: ticketCode });
      } catch (err) {
        // log only
        console.warn('Could not send whatsapp ticket:', err.message);
      }

      res.status(201).json({ message: 'Booking created', booking, trip });
    } catch (error) {
      console.error('Create booking error:', error.message);
      res.status(500).json({ message: 'Failed to create booking', error: error.message });
    }
  }
}

module.exports = TripController;