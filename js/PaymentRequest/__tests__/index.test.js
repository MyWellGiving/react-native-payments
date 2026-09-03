const {
  mockReactNativeIOS,
  mockNativePaymentsSupportedIOS,
  mockNativePaymentsUnsupportedIOS
} = require('../__mocks__');

jest.mock('react-native', () => mockReactNativeIOS);
jest.mock('../../NativeBridge', () => mockNativePaymentsSupportedIOS);
const PaymentRequest = require('../').default;

// helpers
export function createCreatedPaymentRequest(methodData, details, options) {
  const paymentRequest = new PaymentRequest(methodData, details, options);

  return paymentRequest;
}

export function createInteractivePaymentRequest(methodData, details, options) {
  const paymentRequest = new PaymentRequest(methodData, details, options);
  paymentRequest._state = 'interactive';

  return paymentRequest;
}

export function createClosedPaymentRequest(methodData, details, options) {
  const paymentRequest = new PaymentRequest(methodData, details, options);
  paymentRequest._state = 'closed';

  return paymentRequest;
}

export function createUpdatingPaymentRequest(methodData, details, options) {
  const paymentRequest = new PaymentRequest(methodData, details, options);
  paymentRequest._state = 'interactive';
  paymentRequest._updating = true;

  return paymentRequest;
}

// constants
const METHOD_DATA = [
  {
    supportedMethods: ['apple-pay'],
    data: {
      merchantId: '12345'
    }
  }
];
const id = 'foo';
const total = {
  label: 'Total',
  amount: { currency: 'USD', value: '20.00' }
};
const displayItems = [
  {
    label: 'Subtotal',
    amount: { currency: 'USD', value: '20.00' }
  }
];
const DETAILS = {
  id,
  total,
  displayItems
};

describe('PaymentRequest', () => {
  describe('constructor', () => {});

  describe('attributes', () => {
    describe('id', () => {
      it('should have the same id as `details.id`', () => {
        const request = new PaymentRequest(METHOD_DATA, DETAILS);

        expect(request.id).toBe('foo');
      });

      it('should generate id when `details.id` is not provided', () => {
        const request = new PaymentRequest(METHOD_DATA, DETAILS);

        expect(request.id).toBeTruthy();
      });
    });

    describe('shippingAddress', () => {
      it('should have a `null` default shippingAddress', () => {
        const request = new PaymentRequest(METHOD_DATA, DETAILS);

        expect(request.shippingAddress).toBe(null);
      });
    });

    describe('shippingOption', () => {
      it('should have a `null` default shippingOption', () => {
        const request = new PaymentRequest(METHOD_DATA, DETAILS);

        expect(request.shippingOption).toBe(null);
      });

      it('should default to first `shippingOption.id`', () => {
        const shippingOptions = [
          {
            id: 'next-day',
            label: 'Next Day Delivery',
            amount: { currency: 'USD', value: '12.00' }
          }
        ];
        const detailsWithShippingOptions = Object.assign({}, DETAILS, {
          shippingOptions
        });

        const request = new PaymentRequest(
          METHOD_DATA,
          detailsWithShippingOptions
        );

        expect(request.shippingOption).toBe('next-day');
      });
    });
  });

  describe('methods', () => {
    describe('show', () => {
      it('should set `_state` to `interactive`', () => {});

      it('should set `_acceptPromise` to a `Promise`', () => {});

      it('should return a `PaymentResponse` with a `requestId`, `methodName`, and `details`', () => {});
    });

    describe('abort', () => {
      it('should reject `_state` is not equal to `interactive`', async () => {
        const createdPaymentRequest = createCreatedPaymentRequest(
          METHOD_DATA,
          DETAILS
        );

        let error = null;

        try {
          await createdPaymentRequest.abort();
        } catch(e) {
          error = e;
        }

        expect(error.message).toBe('InvalidStateError');
      });

      it('should resolve to `undefined`', async () => {
        const interactivePaymentRequest = createInteractivePaymentRequest(
          METHOD_DATA,
          DETAILS
        );

        const result = await interactivePaymentRequest.abort();

        expect(result).toBe(undefined);
      });

      it('should set `_state` to `closed`', async () => {
        const interactivePaymentRequest = createInteractivePaymentRequest(
          METHOD_DATA,
          DETAILS
        );

        await interactivePaymentRequest.abort();

        expect(interactivePaymentRequest._state).toBe('closed');
      });
    });

    describe('canMakePayments', () => {
      it('should return true when Payments is available', async () => {
        const request = new PaymentRequest(METHOD_DATA, DETAILS);

        const result = await request.canMakePayments();

        expect(result).toBe(true);
      });
    });

    describe('_handleUserAccept (iOS)', () => {
      const shippingContact = {
        name: { givenName: 'Jane', familyName: 'Appleseed' },
        emailAddress: 'jane@example.com',
        phoneNumber: '5551234567',
        postalAddress: {}
      };
      const acceptDetails = {
        transactionIdentifier: 'abc',
        paymentData: JSON.stringify({ data: 'x' }),
        billingContact: '',
        shippingContact: JSON.stringify(shippingContact),
        paymentMethod: { displayName: 'Visa 1234' }
      };

      it('reads payer name and email from the authorized shipping contact without a shipping address event', async () => {
        const request = createInteractivePaymentRequest(METHOD_DATA, DETAILS, {
          requestPayerName: true,
          requestPayerEmail: true
        });
        const accepted = new Promise(resolve => {
          request._acceptPromiseResolver = resolve;
        });

        expect(request._shippingAddress).toBe(null);
        request._handleUserAccept(acceptDetails);
        const response = await accepted;

        expect(response.payerName).toBe('Jane Appleseed');
        expect(response.payerEmail).toBe('jane@example.com');
        expect(response.payerPhone).toBe(null);
        expect(response.details.shippingContact).toEqual(shippingContact);
      });

      it('returns null payer fields when they were not requested', async () => {
        const request = createInteractivePaymentRequest(METHOD_DATA, DETAILS);
        const accepted = new Promise(resolve => {
          request._acceptPromiseResolver = resolve;
        });

        request._handleUserAccept(acceptDetails);
        const response = await accepted;

        expect(response.payerName).toBe(null);
        expect(response.payerEmail).toBe(null);
      });

      it('does not throw when name is requested and the sheet returned no contact', async () => {
        const request = createInteractivePaymentRequest(METHOD_DATA, DETAILS, {
          requestPayerName: true
        });
        const accepted = new Promise(resolve => {
          request._acceptPromiseResolver = resolve;
        });

        expect(() =>
          request._handleUserAccept({ ...acceptDetails, shippingContact: '' })
        ).not.toThrow();
        const response = await accepted;
        expect(response.payerName).toBe(null);
      });
    });
  });
});
